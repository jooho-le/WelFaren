import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AssetFormData } from './AssetInput'
import { requestChatReply } from '@/api/chat'

type Step = 0 | 1 | 2

type Msg = {
  id: string
  role: 'assistant' | 'user'
  text: string
  pending?: boolean
  local?: boolean
  error?: boolean
}

const INITIAL_MESSAGE =
  '안녕하세요, 금융복지 상담사 WelFAI입니다. 생활 여건과 목표를 알려주시면 맞춤 제도와 활용 팁을 안내해 드릴게요.'

const STEP_LABELS: Record<Step, string> = {
  0: '자산 입력',
  1: '복지추천',
  2: 'DSA 비교',
}

const numberFormat = new Intl.NumberFormat('ko-KR')

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const sanitizeNumber = (v?: number | null) => {
  if (v === undefined || v === null || Number.isNaN(v)) return undefined
  return v
}

const STEP_MOVE_MESSAGES: Record<Step, string> = {
  0: '자산 입력 기능으로 이동했습니다.',
  1: '복지추천 기능으로 이동했습니다.',
  2: 'DSA 비교 기능으로 이동했습니다.',
}

type NumericCandidate = {
  value: number
  digits: number
  start: number
  end: number
  suffix?: string
}

const extractNumericCandidates = (text: string): NumericCandidate[] => {
  const matches: NumericCandidate[] = []
  const regex = /([0-9][0-9,]*)([^\d\s])?/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const digits = Number(match[1].replace(/,/g, ''))
    const suffix = match[2] ?? ''
    let scale = 1
    if (suffix === '억') scale = 100_000_000
    else if (suffix === '만') scale = 10_000
    else if (suffix === '천') scale = 1_000
    const value = digits * scale
    matches.push({
      value,
      digits,
      start: match.index,
      end: match.index + match[0].length,
      suffix: suffix || undefined,
    })
  }
  return matches
}

const AGE_HINTS = ['세', '살', '나이', '학년']
const PERSON_HINTS = ['명', '인']
const CURRENCY_HINTS = ['원', '만', '억', '천']

const isAgeContext = (text: string, candidate: NumericCandidate) => {
  const after = text.slice(candidate.end, candidate.end + 3).trim()
  const before = text.slice(Math.max(0, candidate.start - 3), candidate.start).trim()
  if (AGE_HINTS.some((hint) => after.startsWith(hint) || before.endsWith(hint))) {
    return true
  }
  const around = text.slice(Math.max(0, candidate.start - 5), Math.min(text.length, candidate.end + 5))
  return /나이|살[이에]|세[로]/.test(around)
}

const isPersonContext = (text: string, candidate: NumericCandidate) => {
  const after = text.slice(candidate.end, candidate.end + 2).trim()
  const before = text.slice(Math.max(0, candidate.start - 2), candidate.start).trim()
  return PERSON_HINTS.some((hint) => after.startsWith(hint) || before.endsWith(hint))
}

const normalizeCurrency = (candidate: NumericCandidate) => {
  if (candidate.value >= 10_000) return candidate.value
  if (candidate.suffix && CURRENCY_HINTS.includes(candidate.suffix)) return candidate.value
  if (candidate.digits >= 1 && candidate.digits < 1000) {
    return candidate.value * 10_000
  }
  return candidate.value
}

const findRelevantNumber = (
  text: string,
  keyword: RegExp,
  { preferPerson }: { preferPerson?: boolean } = {}
): number | undefined => {
  const candidates = extractNumericCandidates(text)
  if (!candidates.length) return undefined

  const keywordMatches = Array.from(text.matchAll(keyword))
  const weighted = candidates
    .map((candidate) => {
      const ageContext = isAgeContext(text, candidate)
      if (!preferPerson && ageContext) return null

      const personContext = isPersonContext(text, candidate)
      if (!preferPerson && personContext) return null
      if (preferPerson && !personContext) return null

      let distance = Infinity
      if (keywordMatches.length) {
        distance = Math.min(
          ...keywordMatches.map((match) => {
            const keyStart = match.index ?? 0
            const keyEnd = keyStart + match[0].length
            if (candidate.start >= keyEnd) return candidate.start - keyEnd
            if (candidate.end <= keyStart) return keyStart - candidate.end
            return 0
          })
        )
      } else {
        distance = candidate.start
      }

      const normalizedValue = preferPerson ? candidate.digits : normalizeCurrency(candidate)
      return { candidate, distance, normalizedValue }
    })
    .filter(
      (
        entry
      ): entry is { candidate: NumericCandidate; distance: number; normalizedValue: number } =>
        entry !== null
    )

  if (!weighted.length) return undefined

  weighted.sort((a, b) => a.distance - b.distance)
  return weighted[0].normalizedValue
}

export default function ChatBot({
  data,
  setData,
  step,
  setStep,
  incomeRecognition,
  eligibility,
  fullscreen,
  onExit,
}: {
  data: AssetFormData
  setData: (v: AssetFormData) => void
  step: Step
  setStep: (s: Step) => void
  incomeRecognition: { total: number; perCapita: number }
  eligibility: { baseEligible: boolean; microFinanceEligible: boolean }
  fullscreen?: boolean
  onExit?: () => void
}) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    { id: createId(), role: 'assistant', text: INITIAL_MESSAGE },
  ])
  const [sending, setSending] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const processLocalIntent = (text: string): string | null => {
    const lowered = text.toLowerCase()
    let nextStep: Step | null = null
    const updates: Partial<AssetFormData> = {}
    const savingsUpdates: Partial<AssetFormData['savings']> = {}
    let hasSavingsUpdate = false

    if (/(자산|처음)/.test(lowered)) nextStep = 0
    if (/(복지|추천)/.test(lowered)) nextStep = 1
    if (/(dsa|갈아|비교)/.test(lowered)) nextStep = 2

    if (/(소득|월급)/.test(lowered)) {
      const n = findRelevantNumber(text, /(소득|월\s*수입|월급)/gi)
      if (n !== undefined) updates.monthlyIncome = n
    }
    if (/(가구|식구)/.test(lowered)) {
      const n = findRelevantNumber(text, /(가구|식구|가족)/gi, { preferPerson: true })
      if (n !== undefined) updates.householdSize = Math.max(1, Math.round(n))
    }
    if (/부동산/.test(lowered)) {
      const n = findRelevantNumber(text, /(부동산|집값|주택)/gi)
      if (n !== undefined) updates.realEstate = n
    }
    if (/(예적금|예금|적금|저축)/.test(lowered)) {
      const n = findRelevantNumber(text, /(예적금|예금|적금|저축)/gi)
      if (n !== undefined) updates.deposits = n
    }
    if (/기타/.test(lowered)) {
      const n = findRelevantNumber(text, /(기타|기타 자산|추가 자산)/gi)
      if (n !== undefined) updates.otherAssets = n
    }
    if (/(금리|이율)/.test(lowered)) {
      const n = findRelevantNumber(text, /(금리|이율)/gi)
      if (n !== undefined) {
        savingsUpdates.annualRate = n >= 1 ? n / 100 : n
        hasSavingsUpdate = true
      }
    }
    if (/(만기|개월|기간)/.test(lowered)) {
      const n = findRelevantNumber(text, /(만기|개월|기간)/gi)
      if (n !== undefined) {
        savingsUpdates.monthsRemaining = Math.round(n)
        hasSavingsUpdate = true
      }
    }
    if (/(잔액|원금|금액)/.test(lowered) && /(적금|예금|저축)/.test(lowered)) {
      const n = findRelevantNumber(text, /(잔액|원금|금액)/gi)
      if (n !== undefined) {
        savingsUpdates.principal = n
        hasSavingsUpdate = true
      }
    }
    if (/(위약|페널티|중도|해지)/.test(lowered)) {
      const n = findRelevantNumber(text, /(위약|페널티|중도|해지)/gi)
      if (n !== undefined) {
        savingsUpdates.earlyTerminatePenaltyRate = n >= 1 ? n / 100 : n
        hasSavingsUpdate = true
      }
    }

    const summary: string[] = []
    let updatedData = data

    if (Object.keys(updates).length > 0 || hasSavingsUpdate) {
      updatedData = {
        ...data,
        ...updates,
        savings: {
          ...data.savings,
          ...(hasSavingsUpdate ? savingsUpdates : {}),
        },
      }
      setData(updatedData)

      if (updates.monthlyIncome !== undefined) {
        summary.push(`월 소득을 ${numberFormat.format(updatedData.monthlyIncome)}원으로 반영했어요.`)
      }
      if (updates.householdSize !== undefined) {
        summary.push(`가구원 수를 ${updatedData.householdSize}명으로 반영했어요.`)
      }
      if (updates.realEstate !== undefined) {
        summary.push(`부동산 자산을 ${numberFormat.format(updatedData.realEstate)}원으로 업데이트했습니다.`)
      }
      if (updates.deposits !== undefined) {
        summary.push(`예적금 잔액을 ${numberFormat.format(updatedData.deposits)}원으로 기록했어요.`)
      }
      if (updates.otherAssets !== undefined) {
        summary.push(`기타 자산을 ${numberFormat.format(updatedData.otherAssets)}원으로 반영했어요.`)
      }
      if (hasSavingsUpdate) {
        const rate = (updatedData.savings.annualRate ?? 0) * 100
        const remaining = updatedData.savings.monthsRemaining
        summary.push(
          `적금 정보: 잔액 ${numberFormat.format(updatedData.savings.principal ?? 0)}원, ` +
            `금리 ${rate.toFixed(2)}%` +
            (remaining !== undefined ? `, 남은 기간 ${remaining}개월` : '')
        )
      }
    }

    if (nextStep !== null) {
      setStep(nextStep)
      summary.push(STEP_MOVE_MESSAGES[nextStep])
    }

    if (summary.length === 0) return null
    return `${summary.join(' ')} 잘못된 정보라면 다시 말씀해주세요.`
  }

  const buildContextPayload = () => ({
    step,
    assets: {
      monthlyIncome: sanitizeNumber(data.monthlyIncome),
      householdSize: sanitizeNumber(data.householdSize),
      realEstate: sanitizeNumber(data.realEstate),
      deposits: sanitizeNumber(data.deposits),
      otherAssets: sanitizeNumber(data.otherAssets),
      savings: {
        productName: data.savings?.productName || undefined,
        principal: sanitizeNumber(data.savings?.principal),
        annualRate: sanitizeNumber(data.savings?.annualRate),
        monthsRemaining: sanitizeNumber(data.savings?.monthsRemaining),
        earlyTerminatePenaltyRate: sanitizeNumber(data.savings?.earlyTerminatePenaltyRate),
      },
    },
    incomeRecognition: {
      total: sanitizeNumber(incomeRecognition.total),
      perCapita: sanitizeNumber(incomeRecognition.perCapita),
    },
    eligibility: {
      baseEligible: eligibility.baseEligible,
      microFinanceEligible: eligibility.microFinanceEligible,
    },
  })

  const handleSend = async (message?: string) => {
    if (sending) return
    const text = (message ?? input).trim()
    if (!text) return

    const userMessage: Msg = { id: createId(), role: 'user', text }
    const nextMessages: Msg[] = [...messages, userMessage]

    const localSummary = processLocalIntent(text)
    if (localSummary) {
      nextMessages.push({
        id: createId(),
        role: 'assistant',
        text: localSummary,
        local: true,
      })
    }

    const pendingId = createId()
    const pending: Msg = {
      id: pendingId,
      role: 'assistant',
      text: '답변을 준비하고 있어요...',
      pending: true,
    }

    setMessages([...nextMessages, pending])
    setInput('')
    setSending(true)
    setLastError(null)

    const payloadMessages = nextMessages.map((m) => ({
      role: m.role,
      content: m.text,
    }))

    try {
      const response = await requestChatReply({
        messages: payloadMessages,
        context: buildContextPayload(),
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === pendingId ? { ...msg, text: response.reply, pending: false } : msg
        )
      )
    } catch (err) {
      const fallback = err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.'
      setLastError(fallback)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === pendingId
            ? {
                ...msg,
                text: '죄송해요. 답변 생성에 실패했어요. 잠시 후 다시 시도해 주세요.',
                pending: false,
                error: true,
              }
            : msg
        )
      )
    } finally {
      setSending(false)
    }
  }

  const quickActions = [
    { label: '자산 입력', onClick: () => setStep(0) },
    { label: '복지 추천', onClick: () => setStep(1) },
    { label: 'DSA 비교', onClick: () => setStep(2) },
    { label: '월 소득 300만원', onClick: () => handleSend('월 소득 300만원으로 계산해줘') },
    { label: '가구원 3명', onClick: () => handleSend('가구원 3명이고요') },
  ]

  const renderInline = (text: string): ReactNode => {
    const result: ReactNode[] = []
    const regex = /\*\*(.+?)\*\*/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) {
        result.push(text.slice(last, match.index))
      }
      result.push(<strong key={`${match.index}-${match[1]}`}>{match[1]}</strong>)
      last = regex.lastIndex
    }
    if (last < text.length) {
      result.push(text.slice(last))
    }
    return result.length ? result : text
  }

  const renderMessageContent = (text: string): ReactNode => {
    const paragraphs = text.trim().split(/\n{2,}/).filter(Boolean)
    return paragraphs.map((block, idx) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      const isList = lines.length > 1 && lines.every((l) => /^[-*•]/.test(l))
      if (isList) {
        return (
          <ul key={`list-${idx}`} className="bubble-list">
            {lines.map((line, liIdx) => {
              const item = line.replace(/^[-*•]\s*/, '')
              return <li key={liIdx}>{renderInline(item)}</li>
            })}
          </ul>
        )
      }
      return (
        <p key={`para-${idx}`} className="bubble-paragraph">
          {lines.map((line, lineIdx) => (
            <span key={lineIdx}>
              {renderInline(line)}
              {lineIdx !== lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      )
    })
  }

  return (
    <div className={`chatbot ${fullscreen ? 'fullscreen' : ''}`} aria-live="polite">
      <div className="chat-window">
        <div className="chat-header">
          <div className="logo" style={{ width: 20, height: 20 }} />
          <div style={{ fontWeight: 700, fontSize: 13 }}>AI 상담</div>
          <div className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
            금융·복지 상담 전용
          </div>
          {onExit && (
            <button
              type="button"
              className="chip small"
              onClick={onExit}
              style={{ marginLeft: 8 }}
            >
              나가기
            </button>
          )}
        </div>
        <div ref={bodyRef} className="chat-body">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bubble ${m.role === 'assistant' ? 'ai' : 'user'} ${
                m.pending ? 'pending' : ''
              } ${m.error ? 'error' : ''}`}
            >
              {m.role === 'assistant' ? renderMessageContent(m.text) : m.text}
            </div>
          ))}
        </div>
        <div className="quick-replies">
          {quickActions.map((q) => (
            <button key={q.label} className="chip" type="button" onClick={q.onClick}>
              {q.label}
            </button>
          ))}
        </div>
        {lastError && (
          <div className="inline-error" role="alert">
            {lastError}
          </div>
        )}
        <div className="chat-input">
          <input
            value={input}
            placeholder="예) 월 소득 280만원 / 복지 추천 알려줘"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            disabled={sending}
          />
          <button type="button" onClick={() => handleSend()} disabled={sending}>
            {sending ? '전송 중…' : '전송'}
          </button>
        </div>
      </div>
    </div>
  )
}
