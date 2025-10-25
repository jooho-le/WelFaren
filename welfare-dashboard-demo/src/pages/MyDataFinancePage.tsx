import { useMemo, useState } from 'react'
import type { AssetFormData } from '../components/AssetInput'

type LoanInfo = {
  lender: string
  amount: number
  annualRate: number // stored as fraction, e.g. 0.035
  remainingMonths: number
  purpose?: string
}

type LoanDraft = {
  lender: string
  amount: string
  annualRate: string
  remainingMonths: string
  purpose: string
}

const emptyLoanDraft: LoanDraft = {
  lender: '',
  amount: '',
  annualRate: '',
  remainingMonths: '',
  purpose: ''
}

export default function MyDataFinancePage({ navigate, data }: { navigate: (p: string) => void, data: AssetFormData }) {
  const authed = !!(typeof localStorage !== 'undefined' && localStorage.getItem('authToken'))
  const [loans, setLoans] = useState<LoanInfo[]>([])
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [loanDraft, setLoanDraft] = useState<LoanDraft>(emptyLoanDraft)
  const [loanError, setLoanError] = useState<string | null>(null)

  const savingsProduct = useMemo(() => {
    const s = data?.savings
    if (!s) return null
    return {
      title: s.productName || '적금 상품',
      amount: s.principal,
      annualRate: s.annualRate,
      remainingMonths: s.monthsRemaining,
      penaltyRate: s.earlyTerminatePenaltyRate
    }
  }, [data])

  const totals = useMemo(() => {
    const savingsAmount = savingsProduct?.amount ?? 0
    const loanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0)
    return { savingsAmount, loanAmount }
  }, [loans, savingsProduct])

  const openLoanModal = () => {
    setLoanDraft(emptyLoanDraft)
    setLoanError(null)
    setShowLoanModal(true)
  }

  const closeLoanModal = () => {
    setShowLoanModal(false)
    setLoanError(null)
  }

  const validateAndAddLoan = () => {
    const lender = loanDraft.lender.trim()
    const amount = Number(loanDraft.amount)
    const annualRate = Number(loanDraft.annualRate)
    const remainingMonths = Number(loanDraft.remainingMonths)

    if (!lender) {
      setLoanError('대출 기관명을 입력해 주세요.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setLoanError('대출 잔액은 0보다 큰 숫자로 입력해 주세요.')
      return
    }
    if (!Number.isFinite(annualRate) || annualRate < 0) {
      setLoanError('연 금리는 0 이상의 숫자로 입력해 주세요.')
      return
    }
    if (!Number.isFinite(remainingMonths) || remainingMonths < 0) {
      setLoanError('잔여 기간은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    const nextLoan: LoanInfo = {
      lender,
      amount,
      annualRate: annualRate / 100,
      remainingMonths,
      purpose: loanDraft.purpose.trim() || undefined
    }
    setLoans((prev) => [...prev, nextLoan])
    setLoanDraft(emptyLoanDraft)
    setLoanError(null)
    setShowLoanModal(false)
  }

  return (
    <div className="panel">
      <div className="section-title" style={{ fontSize: 32, textAlign: 'center' }}>보유 금융상품 요약</div>
      {!authed && (
        <div className="muted" style={{ textAlign: 'center', marginBottom: 10, fontSize: 12, opacity: 0.8 }}>
          해당 내용은 예시입니다. 회원가입/로그인 후 본인의 정보를 확인할 수 있습니다.
        </div>
      )}
      <div className="spacer" />

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <div className="card kpi">
          <div>
            <div className="value">{totals.savingsAmount.toLocaleString()}원</div>
            <div className="label">총 적금 잔액</div>
          </div>
          <span className="badge info">마이데이터 연동</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{totals.loanAmount.toLocaleString()}원</div>
            <div className="label">총 대출 잔액</div>
          </div>
          <span className={`badge ${totals.loanAmount > 0 ? 'warn' : 'ok'}`}>
            {totals.loanAmount > 0 ? '상환 관리 필요' : '대출 없음'}
          </span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{loans.length}건</div>
            <div className="label">등록 대출 수</div>
          </div>
          <span className="badge secondary">직접 입력</span>
        </div>
      </div>

      <div className="grid" style={{ gap: 12 }}>
        {savingsProduct ? (
          <div className="card" style={{ textAlign: 'left' }}>
            <div className="section-title" style={{ fontSize: 18 }}>적금 상품</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{savingsProduct.title}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              잔여 {savingsProduct.remainingMonths}개월 · 연 {(savingsProduct.annualRate * 100).toFixed(2)}% · 중도해지 페널티 {(savingsProduct.penaltyRate * 100).toFixed(1)}%
            </div>
            <div style={{ marginTop: 12, fontSize: 26, fontWeight: 800 }}>{savingsProduct.amount.toLocaleString()}원</div>
          </div>
        ) : (
          <div className="card muted">등록된 적금 정보가 없습니다. 자산 입력에서 적금 정보를 추가해 주세요.</div>
        )}

        <div className="card" style={{ textAlign: 'left' }}>
          <div className="section-title" style={{ fontSize: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>대출 상품</span>
            <button className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={openLoanModal}>대출 추가</button>
          </div>

          {loans.length === 0 && (
            <div className="muted" style={{ marginTop: 8 }}>등록된 대출 정보가 없습니다. 위 &lsquo;대출 추가&rsquo; 버튼으로 입력해 주세요.</div>
          )}

          <div className="grid" style={{ gap: 8, marginTop: 12 }}>
            {loans.map((loan, index) => (
              <div key={`loan-${index}`} className="card" style={{ textAlign: 'left', background: '#0f172a' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{loan.lender}</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  잔여 {loan.remainingMonths}개월 · 연 {(loan.annualRate * 100).toFixed(2)}%
                  {loan.purpose ? ` · 용도: ${loan.purpose}` : ''}
                </div>
                <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800 }}>{loan.amount.toLocaleString()}원</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn secondary" onClick={() => navigate('/mydata')}>뒤로가기</button>
      </div>

      {showLoanModal && (
        <div className="modal-backdrop" onClick={closeLoanModal}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">대출 정보 입력</div>
              <button className="modal-close" aria-label="닫기" onClick={closeLoanModal}>닫기</button>
            </div>
            <div className="grid cols-2 savings-form-grid">
              <div>
                <label>대출 기관</label>
                <input className="input" value={loanDraft.lender} onChange={(e) => setLoanDraft((prev) => ({ ...prev, lender: e.target.value }))} placeholder="예: OO은행" />
              </div>
              <div>
                <label>대출 잔액(원)</label>
                <input className="input" type="number" value={loanDraft.amount} onChange={(e) => setLoanDraft((prev) => ({ ...prev, amount: e.target.value }))} placeholder="예: 5000000" />
              </div>
              <div>
                <label>연 금리(%)</label>
                <input className="input" type="number" step="0.01" value={loanDraft.annualRate} onChange={(e) => setLoanDraft((prev) => ({ ...prev, annualRate: e.target.value }))} placeholder="예: 5.2" />
              </div>
              <div>
                <label>잔여 기간(개월)</label>
                <input className="input" type="number" value={loanDraft.remainingMonths} onChange={(e) => setLoanDraft((prev) => ({ ...prev, remainingMonths: e.target.value }))} placeholder="예: 24" />
              </div>
              <div>
                <label>용도 (선택)</label>
                <input className="input" value={loanDraft.purpose} onChange={(e) => setLoanDraft((prev) => ({ ...prev, purpose: e.target.value }))} placeholder="예: 전세자금" />
              </div>
            </div>
            <div className="row modal-actions">
              {loanError && <div className="form-error">{loanError}</div>}
              <div className="modal-gap" />
              <button className="btn secondary" onClick={closeLoanModal}>취소</button>
              <button className="btn" onClick={validateAndAddLoan}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
