import type { AssetFormData } from '../components/AssetInput'

export default function MyDataFinancePage({
  navigate,
  data,
}: {
  navigate: (p: string) => void
  data: AssetFormData
}) {
  const authed = !!(typeof window !== 'undefined' && localStorage.getItem('authToken'))
  const loans = data.loans ?? []
  const loanTotal = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0)
  const savings = data.savings
  const savingsMaturity = (() => {
    const months = Math.max(0, savings.monthsRemaining || 0)
    return Math.round((savings.principal || 0) * (1 + (savings.annualRate || 0) * (months / 12)))
  })()

  return (
    <div className="panel">
      <div className="section-title" style={{ fontSize: 32, textAlign: 'center' }}>보유 금융상품 요약</div>
      {!authed && (
        <div className="muted" style={{ textAlign: 'center', marginBottom: 10, fontSize: 12 }}>
          마이데이터 연동 시 실제 자산으로 자동 갱신되며, 수정은 자산 탭에서 진행할 수 있습니다.
        </div>
      )}
      <div className="muted" style={{ textAlign: 'center', marginBottom: 18 }}>
        적금과 대출 정보는 <strong>마이데이터 &gt; 자산</strong> 화면에서 입력·편집할 수 있어요.
      </div>

      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <div className="card kpi">
          <div>
            <div className="value">{(savings.principal || 0).toLocaleString()}원</div>
            <div className="label">현재 적금 잔액</div>
          </div>
          <span className="badge info">마이데이터</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{loanTotal.toLocaleString()}원</div>
            <div className="label">총 대출 잔액</div>
          </div>
          <span className={`badge ${loanTotal > 0 ? 'warn' : 'ok'}`}>{loanTotal > 0 ? '상환 관리 필요' : '대출 없음'}</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{loans.length}건</div>
            <div className="label">등록 대출 수</div>
          </div>
          <span className="badge secondary">자산 탭에서 관리</span>
        </div>
      </div>

      <div className="grid" style={{ gap: 12 }}>
        <div className="card" style={{ textAlign: 'left' }}>
          <div className="section-title" style={{ fontSize: 18 }}>적금 상품</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {savings.productName || '등록된 적금이 없습니다.'}
          </div>
          {savings.productName ? (
            <>
              <div className="muted" style={{ marginTop: 6 }}>
                잔여 {Math.max(0, savings.monthsRemaining || 0)}개월 · 연 {(savings.annualRate * 100).toFixed(2)}% · 중도해지 페널티 {(savings.earlyTerminatePenaltyRate * 100).toFixed(1)}%
              </div>
              <div style={{ marginTop: 12, fontSize: 26, fontWeight: 800 }}>{(savings.principal || 0).toLocaleString()}원</div>
              <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                만기 예상 금액 {savingsMaturity.toLocaleString()}원
              </div>
            </>
          ) : (
            <div className="muted" style={{ marginTop: 6 }}>
              아직 적금 정보가 없습니다. 아래 버튼을 눌러 자산 입력 화면에서 추가하세요.
            </div>
          )}
        </div>

        <div className="card" style={{ textAlign: 'left' }}>
          <div className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>대출 리스트</div>
          {loans.length === 0 && (
            <div className="muted">등록된 대출이 없습니다. 자산 입력 화면에서 추가할 수 있습니다.</div>
          )}
          <div className="grid" style={{ gap: 8 }}>
            {loans.map((loan, index) => (
              <div key={`loan-${index}`} className="card" style={{ background: '#0f172a' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{loan.lender}</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  잔여 {loan.remainingMonths}개월 · 연 {(loan.annualRate * 100).toFixed(2)}%
                  {loan.purpose ? ` · 용도 ${loan.purpose}` : ''}
                </div>
                <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800 }}>{loan.amount.toLocaleString()}원</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 20 }}>
        <button type="button" className="btn secondary" onClick={() => navigate('/mydata')}>
          뒤로가기
        </button>
        <button type="button" className="btn" onClick={() => navigate('/mydata/assets')}>
          자산 입력 화면으로 이동
        </button>
      </div>
    </div>
  )
}
