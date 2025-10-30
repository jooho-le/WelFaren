import { useEffect, useMemo, useState } from 'react'
import type { AssetFormData } from '@/components/AssetInput'
import MyDataFinancePage from './MyDataFinancePage'
import MyDataAssetsPage from './MyDataAssetsPage'
import MyDataWelfarePage from './MyDataWelfarePage'

type TabKey = 'finance' | 'assets' | 'welfare'

const TAB_CONFIG: Array<{ key: TabKey; label: string; tone: 'solid' | 'secondary' | 'alert'; path: string }> = [
  { key: 'finance', label: '금융상품', tone: 'solid', path: '/mydata/finance' },
  { key: 'assets', label: '자산', tone: 'secondary', path: '/mydata/assets' },
  { key: 'welfare', label: '복지', tone: 'alert', path: '/mydata/welfare' },
]

type LoanDraft = {
  lender: string
  amount: string
  annualRate: string
  remainingMonths: string
  purpose: string
}

const EMPTY_LOAN: LoanDraft = {
  lender: '',
  amount: '',
  annualRate: '',
  remainingMonths: '',
  purpose: '',
}

function AssetEntrySection({
  data,
  setData,
}: {
  data: AssetFormData
  setData: (next: AssetFormData) => void
}) {
  const [assetDraft, setAssetDraft] = useState({
    monthlyIncome: data.monthlyIncome ? String(data.monthlyIncome) : '',
    realEstate: data.realEstate ? String(data.realEstate) : '',
    deposits: data.deposits ? String(data.deposits) : '',
    otherAssets: data.otherAssets ? String(data.otherAssets) : '',
  })
  const [householdDraft, setHouseholdDraft] = useState(data.householdSize ? String(data.householdSize) : '1')
  const [savingsDraft, setSavingsDraft] = useState({
    productName: data.savings.productName || '',
    principal: data.savings.principal ? String(data.savings.principal) : '',
    annualRate: data.savings.annualRate ? (data.savings.annualRate * 100).toString() : '',
    monthsRemaining: data.savings.monthsRemaining ? String(data.savings.monthsRemaining) : '',
    penalty: data.savings.earlyTerminatePenaltyRate ? (data.savings.earlyTerminatePenaltyRate * 100).toString() : '',
  })
  const [loanDraft, setLoanDraft] = useState<LoanDraft>({ ...EMPTY_LOAN })
  const [loanError, setLoanError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    setAssetDraft({
      monthlyIncome: data.monthlyIncome ? String(data.monthlyIncome) : '',
      realEstate: data.realEstate ? String(data.realEstate) : '',
      deposits: data.deposits ? String(data.deposits) : '',
      otherAssets: data.otherAssets ? String(data.otherAssets) : '',
    })
    setHouseholdDraft(data.householdSize ? String(data.householdSize) : '1')
    setSavingsDraft({
      productName: data.savings.productName || '',
      principal: data.savings.principal ? String(data.savings.principal) : '',
      annualRate: data.savings.annualRate ? (data.savings.annualRate * 100).toString() : '',
      monthsRemaining: data.savings.monthsRemaining ? String(data.savings.monthsRemaining) : '',
      penalty: data.savings.earlyTerminatePenaltyRate
        ? (data.savings.earlyTerminatePenaltyRate * 100).toString()
        : '',
    })
  }, [
    data.monthlyIncome,
    data.realEstate,
    data.deposits,
    data.otherAssets,
    data.householdSize,
    data.savings.productName,
    data.savings.principal,
    data.savings.annualRate,
    data.savings.monthsRemaining,
    data.savings.earlyTerminatePenaltyRate,
  ])

  const handleAssetChange = (field: keyof typeof assetDraft, raw: string) => {
    const sanitized = raw.replace(/\D/g, '')
    setAssetDraft((prev) => ({ ...prev, [field]: sanitized }))
    const numeric = sanitized === '' ? 0 : Number(sanitized)
    setData({ ...data, [field]: numeric })
  }

  const handleHouseholdChange = (raw: string) => {
    const sanitized = raw.replace(/\D/g, '')
    setHouseholdDraft(sanitized)
    const numeric = sanitized === '' ? 1 : Math.max(1, Number(sanitized))
    setData({ ...data, householdSize: numeric })
  }

  const handleSavingsChange = (key: keyof typeof savingsDraft, raw: string) => {
    if (key === 'productName') {
      setSavingsDraft((prev) => ({ ...prev, productName: raw }))
      setData({ ...data, savings: { ...data.savings, productName: raw } })
      return
    }

    if (key === 'principal' || key === 'monthsRemaining') {
      const sanitized = raw.replace(/\D/g, '')
      setSavingsDraft((prev) => ({ ...prev, [key]: sanitized }))
      const numeric = sanitized === '' ? 0 : Number(sanitized)
      setData({
        ...data,
        savings: {
          ...data.savings,
          [key]: key === 'monthsRemaining' ? Math.max(0, Math.round(numeric)) : Math.max(0, numeric),
        },
      })
      return
    }

    const sanitized = raw.replace(/[^0-9.]/g, '')
    const [head, ...rest] = sanitized.split('.')
    const normalized = rest.length > 0 ? `${head}.${rest.join('')}` : head

    if (key === 'annualRate') {
      setSavingsDraft((prev) => ({ ...prev, annualRate: normalized }))
      const numeric = normalized === '' ? 0 : Number(normalized) / 100
      setData({ ...data, savings: { ...data.savings, annualRate: Math.max(0, numeric) } })
    } else if (key === 'penalty') {
      setSavingsDraft((prev) => ({ ...prev, penalty: normalized }))
      const numeric = normalized === '' ? 0 : Number(normalized) / 100
      setData({ ...data, savings: { ...data.savings, earlyTerminatePenaltyRate: Math.max(0, numeric) } })
    }
  }

  const handleLoanDraft = <K extends keyof LoanDraft>(key: K, value: LoanDraft[K]) => {
    setLoanError(null)

    if (key === 'amount' || key === 'remainingMonths') {
      const sanitized = value.replace(/\D/g, '')
      setLoanDraft((prev) => ({ ...prev, [key]: sanitized }))
      return
    }

    if (key === 'annualRate') {
      const sanitized = value.replace(/[^0-9.]/g, '')
      const [head, ...rest] = sanitized.split('.')
      const normalized = rest.length > 0 ? `${head}.${rest.join('')}` : head
      setLoanDraft((prev) => ({ ...prev, annualRate: normalized }))
      return
    }

    setLoanDraft((prev) => ({ ...prev, [key]: value }))
  }

  const addLoan = () => {
    const lender = loanDraft.lender.trim()
    const amount = loanDraft.amount === '' ? 0 : Number(loanDraft.amount)
    const annualRate = loanDraft.annualRate === '' ? 0 : Number(loanDraft.annualRate)
    const remainingMonths = loanDraft.remainingMonths === '' ? 0 : Number(loanDraft.remainingMonths)

    if (!lender) {
      setLoanError('대출 기관명을 입력해 주세요.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setLoanError('대출 잔액은 0보다 큰 숫자로 입력해 주세요.')
      return
    }
    if (!Number.isFinite(annualRate) || annualRate < 0) {
      setLoanError('연 금리는 0 이상으로 입력해 주세요.')
      return
    }
    if (!Number.isFinite(remainingMonths) || remainingMonths < 0) {
      setLoanError('잔여 기간은 0 이상 개월 수로 입력해 주세요.')
      return
    }

    const nextLoan = {
      lender,
      amount,
      annualRate: annualRate / 100,
      remainingMonths: Math.round(remainingMonths),
      purpose: loanDraft.purpose.trim() || undefined,
    }

    setData({ ...data, loans: [...(data.loans ?? []), nextLoan] })
    setLoanDraft({ ...EMPTY_LOAN })
    setLoanError(null)
  }

  const removeLoan = (index: number) => {
    setData({ ...data, loans: (data.loans ?? []).filter((_, i) => i !== index) })
  }

  const totalLoan = useMemo(
    () => (data.loans ?? []).reduce((sum, loan) => sum + (loan.amount || 0), 0),
    [data.loans],
  )

  return (
    <div className="panel" style={{ textAlign: 'left', marginBottom: 28 }}>
      <div className="section-title" style={{ fontSize: 26, marginBottom: 18 }}>자산 및 금융정보 입력</div>

      <div className="grid cols-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>기본 자산</div>
          <div className="grid cols-2" style={{ gap: 12 }}>
            <label className="form-field">
              <span>월 소득(원)</span>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={assetDraft.monthlyIncome}
                placeholder="예: 2800000"
                onChange={(e) => handleAssetChange('monthlyIncome', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>가구원 수</span>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={householdDraft}
                placeholder="예: 2"
                onChange={(e) => handleHouseholdChange(e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>부동산 자산</span>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={assetDraft.realEstate}
                placeholder="예: 120000000"
                onChange={(e) => handleAssetChange('realEstate', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>예·적금</span>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={assetDraft.deposits}
                placeholder="예: 15000000"
                onChange={(e) => handleAssetChange('deposits', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>기타 자산</span>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={assetDraft.otherAssets}
                placeholder="예: 2000000"
                onChange={(e) => handleAssetChange('otherAssets', e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>예·적금 상세</div>
          <div className="grid cols-2" style={{ gap: 12 }}>
            <label className="form-field">
              <span>상품명</span>
              <input
                className="input"
                value={savingsDraft.productName}
                onChange={(e) => handleSavingsChange('productName', e.target.value)}
                placeholder="예: 청년 미래드림 적금"
              />
            </label>
            <label className="form-field">
              <span>현재 잔액(원)</span>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={savingsDraft.principal}
                placeholder="예: 5000000"
                onChange={(e) => handleSavingsChange('principal', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>연 이율(%)</span>
              <input
                className="input"
                inputMode="decimal"
                value={savingsDraft.annualRate}
                placeholder="예: 3.4"
                onChange={(e) => handleSavingsChange('annualRate', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>잔여 기간(개월)</span>
              <input
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={savingsDraft.monthsRemaining}
                placeholder="예: 8"
                onChange={(e) => handleSavingsChange('monthsRemaining', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span>중도해지 페널티(%)</span>
              <input
                className="input"
                inputMode="decimal"
                value={savingsDraft.penalty}
                placeholder="예: 1"
                onChange={(e) => handleSavingsChange('penalty', e.target.value)}
              />
            </label>
          </div>

          <div className="row" style={{ marginTop: 12, alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSaveMessage('적금 정보가 저장되었습니다.')
                setTimeout(() => setSaveMessage(null), 2000)
              }}
            >
              적금 추가
            </button>
            {saveMessage && <span className="muted" style={{ fontSize: 12 }}>{saveMessage}</span>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>대출 정보 입력</span>
          <span className="badge secondary">총 {totalLoan.toLocaleString()}원</span>
        </div>

        <div className="grid cols-5" style={{ gap: 12, marginBottom: 12 }}>
          <input
            className="input"
            placeholder="대출 기관"
            value={loanDraft.lender}
            onChange={(e) => handleLoanDraft('lender', e.target.value)}
          />
          <input
            className="input"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="잔액(원)"
            value={loanDraft.amount}
            onChange={(e) => handleLoanDraft('amount', e.target.value)}
          />
          <input
            className="input"
            inputMode="decimal"
            placeholder="연 이율(%)"
            value={loanDraft.annualRate}
            onChange={(e) => handleLoanDraft('annualRate', e.target.value)}
          />
          <input
            className="input"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="잔여 기간(개월)"
            value={loanDraft.remainingMonths}
            onChange={(e) => handleLoanDraft('remainingMonths', e.target.value)}
          />
          <input
            className="input"
            placeholder="용도 (선택)"
            value={loanDraft.purpose}
            onChange={(e) => handleLoanDraft('purpose', e.target.value)}
          />
        </div>

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {loanError ? <div className="form-error">{loanError}</div> : <span />}
          <button type="button" className="btn" onClick={addLoan}>
            대출 추가
          </button>
        </div>

        <div className="grid" style={{ gap: 8, marginTop: 14 }}>
          {(!data.loans || data.loans.length === 0) && (
            <div className="card muted" style={{ textAlign: 'center' }}>
              등록된 대출이 없습니다. 필요하다면 위 입력창에서 추가해 주세요.
            </div>
          )}
          {(data.loans ?? []).map((loan, index) => (
            <div key={`loan-${index}`} className="card" style={{ background: '#0f172a' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{loan.lender}</div>
                <button type="button" className="btn secondary" style={{ padding: '4px 10px' }} onClick={() => removeLoan(index)}>
                  삭제
                </button>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                잔여 {loan.remainingMonths}개월 · 연 {(loan.annualRate * 100).toFixed(2)}%
                {loan.purpose ? ` · 용도 ${loan.purpose}` : ''}
              </div>
              <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800 }}>
                {loan.amount.toLocaleString()}원
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MyDataPage({
  navigate,
  data,
  setData,
  authed,
  initialTab = 'assets',
  showEntry = false,
}: {
  navigate: (p: string) => void
  data: AssetFormData
  setData: (next: AssetFormData) => void
  authed: boolean
  initialTab?: TabKey
  showEntry?: boolean
}) {
  const [tab, setTab] = useState<TabKey>(initialTab)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const handleTabChange = (next: TabKey) => {
    setTab(next)
    const path = TAB_CONFIG.find((item) => item.key === next)?.path
    if (path) navigate(path)
  }

  const showContent = !showEntry

  let content: JSX.Element | null = null
  if (showContent) {
    if (tab === 'finance') content = <MyDataFinancePage navigate={navigate} data={data} />
    else if (tab === 'welfare') content = <MyDataWelfarePage navigate={navigate} data={data} authed={authed} />
    else content = <MyDataAssetsPage navigate={navigate} data={data} />
  }

  return (
    <div className="panel" style={{ textAlign: 'center' }}>
      <div className="section-title" style={{ fontSize: 40 }}>현재 나의 금융상품 및 자산보기</div>
      <div className="muted" style={{ marginTop: 8, marginBottom: 16, fontSize: 14 }}>
        마이데이터 정보를 업데이트하고, 금융과 복지를 한 번에 확인하세요.
      </div>

      <div className="row" style={{ justifyContent: 'center', gap: 12, marginBottom: showEntry ? 16 : 24 }}>
        {TAB_CONFIG.map(({ key, label, tone }) => {
          const active = tab === key
          const baseClass = tone === 'alert' ? 'btn alert' : tone === 'secondary' ? 'btn secondary' : 'btn'
          return (
            <button
              key={key}
              type="button"
              className={`${baseClass} ${active ? 'active' : ''}`}
              onClick={() => handleTabChange(key)}
            >
              {label}
            </button>
          )
        })}
      </div>

      {showEntry && <AssetEntrySection data={data} setData={setData} />}

      {showContent ? (
        content
      ) : (
        <div className="muted">아래 버튼을 눌러 금융상품, 자산 포트폴리오, 복지 정보를 살펴보세요.</div>
      )}
    </div>
  )
}
