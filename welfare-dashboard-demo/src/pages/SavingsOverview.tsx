import React from 'react'
import type { AssetFormData, LoanInfo } from '../components/AssetInput'

export default function SavingsOverview({
  navigate,
  data,
}: {
  navigate: (p: string) => void
  data: AssetFormData
}) {
  const authed = !!(typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage.getItem('authToken'))
  const savings = data?.savings ?? { productName: '', principal: 0, annualRate: 0, monthsRemaining: 0, earlyTerminatePenaltyRate: 0 }
  const loans: LoanInfo[] = Array.isArray((data as any)?.loans) ? ((data as any).loans as LoanInfo[]) : []
  const principal = savings.principal || 0
  const months = Math.max(0, savings.monthsRemaining || 0)
  const maturity = Math.round(principal * (1 + (savings.annualRate || 0) * (months / 12)))
  const averageRate = (savings.annualRate || 0) * 100

  return (
    <div className="panel savings-total">
      <div className="section-title">현재 적금 총액</div>
      <div className="amount-big">{principal.toLocaleString()}원</div>
      <div className="muted">
        만기 예상금액 {maturity.toLocaleString()}원 · 현재 적용 금리 {averageRate.toFixed(2)}%
      </div>
      {!authed && (
        <div className="muted" style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          연동 전에는 예시 데이터가 표시됩니다. 로그인 후 마이데이터 &gt; 자산 화면에서 직접 수정하세요.
        </div>
      )}
      <div className="row savings-total-actions">
        <button className="btn" onClick={() => navigate('/mydata/assets')}>
          자산 입력 화면으로 이동
        </button>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <div className="section-title">대출 현황 요약</div>
        {loans.length === 0 ? (
          <div className="muted">등록된 대출이 없습니다. 자산 입력 화면에서 대출 정보를 추가할 수 있습니다.</div>
        ) : (
          <div className="savings-list">
            {loans.map((loan, index) => (
              <div key={index} className="savings-item card">
                <div className="s-item-head">
                  <div className="s-name">{loan.lender}</div>
                  <div className="badge info">잔여 {loan.remainingMonths}개월</div>
                </div>
                <div className="s-grid">
                  <div>
                    <div className="s-label">잔액</div>
                    <div className="s-value">{loan.amount.toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="s-label">적용 금리</div>
                    <div className="s-value">{(loan.annualRate * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="s-label">용도</div>
                    <div className="s-value">{loan.purpose || '미입력'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
