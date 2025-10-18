import { useMemo, useRef, useState, useEffect } from 'react'
import type { AssetFormData } from './AssetInput'

type Msg = { role: 'assistant' | 'user'; text: string }

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
  data: AssetFormData,
  setData: (v: AssetFormData) => void,
  step: 0 | 1 | 2,
  setStep: (s: 0 | 1 | 2) => void,
  incomeRecognition: { total: number; perCapita: number },
  eligibility: { baseEligible: boolean; microFinanceEligible: boolean },
  fullscreen?: boolean,
  onExit?: () => void,
}) {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'assistant',
    text: '안녕하세요! 간단히 대화로 자산 입력, 복지 추천, DSA 갈아타기까지 도와드릴게요. 예) "소득 300만", "가구 3명", "복지 추천", "DSA 보기"'
  }])
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // auto scroll to bottom
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [msgs])

  const quick = useMemo(() => [
    { label: '자산 입력', action: () => setStep(0) },
    { label: '복지 추천', action: () => setStep(1) },
    { label: 'DSA 보기', action: () => setStep(2) },
    { label: '소득 300만', action: () => applyIntent('소득 300만') },
    { label: '가구 3명', action: () => applyIntent('가구 3명') },
  ], [setStep])

  function add(role: Msg['role'], text: string) {
    setMsgs(m => [...m, { role, text }])
  }

  function parseNumberKor(s: string) {
    // very simple: extract digits, fallback to million/만 heuristics
    const num = s.match(/[0-9][0-9,]*/)?.[0]?.replace(/,/g, '')
    if (num) return Number(num)
    if (s.includes('만')) return 1_000_000 // treat "만" without digits as 100만 (rough)
    return undefined
  }

  function applyIntent(text: string) {
    const t = text.toLowerCase()
    const updates: Partial<AssetFormData> = {}
    let did = false

    // navigation intents
    if (/(자산|처음)/.test(t)) { setStep(0); did = true }
    if (/(복지|추천)/.test(t)) { setStep(1); did = true }
    if (/(dsa|갈아타기)/.test(t)) { setStep(2); did = true }

    // numeric updates
    if (/소득/.test(t)) {
      const n = parseNumberKor(t)
      if (n) { updates.monthlyIncome = n >= 10000 ? n : n * 10000; did = true }
    }
    if (/(가구|가족)/.test(t)) {
      const n = parseNumberKor(t)
      if (n) { updates.householdSize = Math.max(1, Math.round(n)); did = true }
    }
    if (/부동산/.test(t)) {
      const n = parseNumberKor(t); if (n) { updates.realEstate = n >= 10000 ? n : n * 10000; did = true }
    }
    if (/(예적금|예금|적금)/.test(t)) {
      const n = parseNumberKor(t); if (n) { updates.deposits = n >= 10000 ? n : n * 10000; did = true }
    }
    if (/(기타)/.test(t)) {
      const n = parseNumberKor(t); if (n) { updates.otherAssets = n >= 10000 ? n : n * 10000; did = true }
    }
    if (/(금리|이율)/.test(t)) {
      const n = parseNumberKor(t); if (n) { const rate = n >= 1 ? n/100 : n; updates.savings = { ...data.savings, annualRate: rate }; did = true }
    }
    if (/(잔여|개월)/.test(t)) {
      const n = parseNumberKor(t); if (n) { updates.savings = { ...data.savings, monthsRemaining: Math.round(n) }; did = true }
    }
    if (/(원금|투자)/.test(t)) {
      const n = parseNumberKor(t); if (n) { updates.savings = { ...data.savings, principal: n >= 10000 ? n : n * 10000 }; did = true }
    }
    if (/(페널티|위약금)/.test(t)) {
      const n = parseNumberKor(t); if (n) { const r = n >= 1 ? n/100 : n; updates.savings = { ...data.savings, earlyTerminatePenaltyRate: r }; did = true }
    }

    if (Object.keys(updates).length) setData({ ...data, ...updates })

    // compose assistant feedback
    if (did) {
      const summary = [
        updates.monthlyIncome !== undefined ? `소득을 ${updates.monthlyIncome.toLocaleString()}원으로 반영했어요.` : null,
        updates.householdSize !== undefined ? `가구원을 ${updates.householdSize}명으로 반영했어요.` : null,
        updates.realEstate !== undefined ? `부동산 ${updates.realEstate.toLocaleString()}원 반영.` : null,
        updates.deposits !== undefined ? `예·적금 ${updates.deposits.toLocaleString()}원 반영.` : null,
        updates.otherAssets !== undefined ? `기타 자산 ${updates.otherAssets.toLocaleString()}원 반영.` : null,
        updates.savings?.annualRate !== undefined ? `금리 ${(updates.savings!.annualRate*100).toFixed(2)}% 반영.` : null,
        updates.savings?.monthsRemaining !== undefined ? `잔여기간 ${updates.savings!.monthsRemaining}개월 반영.` : null,
        updates.savings?.principal !== undefined ? `원금 ${updates.savings!.principal.toLocaleString()}원 반영.` : null,
        updates.savings?.earlyTerminatePenaltyRate !== undefined ? `페널티 ${(updates.savings!.earlyTerminatePenaltyRate*100).toFixed(1)}% 반영.` : null,
      ].filter(Boolean).join(' ')

      const where = step === 0 ? '자산 입력' : step === 1 ? '복지 추천' : 'DSA 추천'
      add('assistant', `${summary || '설정을 반영했어요.'} 현재 화면: ${where}. "요약"이라고 입력하면 계산 결과를 간단히 알려드릴게요.`)
      return
    }

    // summaries
    if (/요약|summary/.test(t)) {
      const line1 = `월 소득인정액 ${incomeRecognition.total.toLocaleString()}원 (1인당 ${incomeRecognition.perCapita.toLocaleString()}원)`
      const line2 = `기초생활: ${eligibility.baseEligible ? '가능성 있음' : '기준 초과'}, 서민금융: ${eligibility.microFinanceEligible ? '가능성 있음' : '가능성 낮음'}`
      add('assistant', `${line1}\n${line2}`)
      return
    }

    add('assistant', '다음과 같이 도와드려요: "소득 300만", "가구 3명", "부동산 1억", "복지 추천", "DSA 보기", "요약"')
  }

  function handleSend() {
    const text = input.trim()
    if (!text) return
    add('user', text)
    setInput('')
    setTimeout(() => applyIntent(text), 50)
  }

  return (
    <div className={`chatbot ${fullscreen ? 'fullscreen' : ''}`} aria-live="polite">
      <div className="chat-window">
        <div className="chat-header">
          <div className="logo" style={{ width: 20, height: 20 }} />
          <div style={{ fontWeight: 700, fontSize: 13 }}>AI 상담</div>
          <div className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>대화로 입력/추천 진행</div>
        </div>
        <div ref={bodyRef} className="chat-body">
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role === 'assistant' ? 'ai' : 'user'}`}>{m.text}</div>
          ))}
        </div>
        <div className="quick-replies">
          {quick.map(q => (
            <button key={q.label} className="chip" onClick={q.action}>{q.label}</button>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={input}
            placeholder="예: 소득 300만 / 복지 추천 / DSA 보기"
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          />
          <button onClick={handleSend}>전송</button>
        </div>
      </div>
    </div>
  )
}
