import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchFinanceRecommendations, type SavingRecommendation, type SavingSwitchResponse } from '@/api/finance'
import type { AssetFormData } from '@/components/AssetInput'

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const scoreFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
})

const confidenceFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'percent',
  maximumFractionDigits: 0,
})

const toCurrency = (value: number) => currencyFormatter.format(Math.round(value))
const toPercent = (value: number) => `${percentFormatter.format(value)}%`

function ReasonsList({ reasons }: { reasons?: string[] }) {
  if (!reasons || reasons.length === 0) return null
  return (
    <ul className="muted" style={{ marginTop: 12, paddingLeft: 18, textAlign: 'left', lineHeight: 1.5 }}>
      {reasons.map((reason, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={index}>{reason}</li>
      ))}
    </ul>
  )
}

function RecommendationCard({ title, recommendation }: { title: string; recommendation: SavingRecommendation | null | undefined }) {
  if (!recommendation) {
    return (
      <div className="card" style={{ minHeight: 220, textAlign: 'left' }}>
        <div className="section-title" style={{ fontSize: 18 }}>{title}</div>
        <div className="muted" style={{ marginTop: 8 }}>충분한 비교 데이터가 없어 추천을 생성하지 못했습니다.</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ minHeight: 220, textAlign: 'left' }}>
      <div className="section-title" style={{ fontSize: 18 }}>{title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{recommendation.product_name}</div>
          <div className="muted" style={{ marginTop: 4 }}>{recommendation.company_name ?? '금융회사 정보 미제공'}</div>
        </div>
        {recommendation.match_score != null && (
          <div className="badge info" style={{ fontSize: 12, padding: '6px 10px' }}>
            적합도 {scoreFormatter.format(recommendation.match_score)}점
          </div>
        )}
      </div>
      <div className="muted" style={{ marginTop: 8 }}>
        금리 {recommendation.rate != null ? toPercent(recommendation.rate) : '정보 없음'}
        {recommendation.rate_gain != null && (
          <span style={{ marginLeft: 6, color: recommendation.rate_gain >= 0 ? '#0ea5e9' : '#f97316' }}>
            ({recommendation.rate_gain >= 0 ? '+' : ''}{percentFormatter.format(recommendation.rate_gain)}%p)
          </span>
        )}
        {recommendation.save_term ? ` · 가입기간 ${recommendation.save_term}개월` : ''}
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        <div>
          <div className="muted">예상 총이자</div>
          <div style={{ fontWeight: 700 }}>{recommendation.interest != null ? toCurrency(recommendation.interest) : '-'}</div>
        </div>
        <div>
          <div className="muted">이자 차익</div>
          <div style={{ fontWeight: 700, color: (recommendation.interest_gain ?? 0) >= 0 ? '#22c55e' : '#f97316' }}>
            {recommendation.interest_gain != null ? toCurrency(recommendation.interest_gain) : '-'}
          </div>
        </div>
        <div>
          <div className="muted">예상 순이익</div>
          <div style={{ fontWeight: 700, color: (recommendation.net_gain ?? 0) >= 0 ? '#22c55e' : '#f97316' }}>
            {recommendation.net_gain != null ? toCurrency(recommendation.net_gain) : '-'}
          </div>
        </div>
      </div>

      {recommendation.description && (
        <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          {recommendation.description}
        </div>
      )}

      <ReasonsList reasons={recommendation.reasons} />

      <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
        {recommendation.join_method ? `가입 경로: ${recommendation.join_method}` : ''}
        {recommendation.join_member ? ` · 가입 대상: ${recommendation.join_member}` : ''}
      </div>

      {recommendation.action && (
        <div className={`badge ${recommendation.net_gain != null && recommendation.net_gain > 0 ? 'ok' : 'secondary'}`} style={{ marginTop: 16, alignSelf: 'flex-start' }}>
          {recommendation.action}
        </div>
      )}
    </div>
  )
}

export default function MyDataFinancePage({
  navigate,
  data,
}: {
  navigate: (p: string) => void
  data: AssetFormData
}) {
  const authed = !!(typeof window !== 'undefined' && localStorage.getItem('authToken'))
  const [savingResult, setSavingResult] = useState<SavingSwitchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestController = useRef<AbortController | null>(null)

  const loansKey = useMemo(() => JSON.stringify(data.loans ?? []), [data.loans])

  const requestPayload = useMemo<AssetFormData>(() => {
    const savingsPayload = {
      productName: data.savings.productName,
      principal: data.savings.principal,
      annualRate: data.savings.annualRate,
      monthsRemaining: data.savings.monthsRemaining,
      earlyTerminatePenaltyRate: data.savings.earlyTerminatePenaltyRate,
      penalty: data.savings.earlyTerminatePenaltyRate ?? 0,
    }

    return {
      monthlyIncome: data.monthlyIncome,
      householdSize: data.householdSize,
      realEstate: data.realEstate,
      deposits: data.deposits,
      otherAssets: data.otherAssets,
      savings: savingsPayload,
      loans: (data.loans ?? []).map((loan) => ({ ...loan })),
    }
  }, [
    data.monthlyIncome,
    data.householdSize,
    data.realEstate,
    data.deposits,
    data.otherAssets,
    data.savings.productName,
    data.savings.principal,
    data.savings.annualRate,
    data.savings.monthsRemaining,
    data.savings.earlyTerminatePenaltyRate,
    loansKey,
  ])

  const payloadKey = useMemo(() => JSON.stringify(requestPayload), [requestPayload])

  const canEvaluate =
    requestPayload.savings.principal > 0 &&
    requestPayload.savings.monthsRemaining > 0 &&
    requestPayload.savings.annualRate > 0

  useEffect(() => {
    requestController.current?.abort()

    if (!canEvaluate) {
      setSavingResult(null)
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    requestController.current = controller
    setLoading(true)
    setError(null)
    fetchFinanceRecommendations(requestPayload, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setSavingResult(response.saving ?? null)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setSavingResult(null)
          setError(err?.message || '추천 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [payloadKey, requestPayload, canEvaluate])

  const loans = data.loans ?? []
  const totalLoanAmount = useMemo(() => loans.reduce((sum, loan) => sum + (loan.amount || 0), 0), [loans])
  const summary = savingResult?.summary
  const current = savingResult?.current
  const best = savingResult?.best ?? null
  const alternatives = savingResult?.alternatives ?? []

  return (
    <div className="panel">
      <div className="section-title" style={{ fontSize: 32, textAlign: 'center' }}>금융 갈아타기 리포트</div>
      <div className="muted" style={{ textAlign: 'center', marginBottom: 16 }}>
        마이데이터에서 입력한 금액과 금리, 가계 현황을 기반으로 더 나은 적금·예금 상품을 탐색합니다.
      </div>
      {!authed && (
        <div className="muted" style={{ textAlign: 'center', marginBottom: 10, fontSize: 12, opacity: 0.8 }}>
          로그인 후 마이데이터 연동을 완료하면 금융사 공시 금리와 실거래 데이터를 자동으로 반영합니다.
        </div>
      )}

      <div className="card" style={{ marginBottom: 18, textAlign: 'left', border: '1px solid #bae6fd', background: '#e0f2fe' }}>
        <div className="section-title" style={{ fontSize: 18, marginBottom: 6 }}>추천 요약</div>
        {!canEvaluate && (
          <div className="muted">
            적금 보유 금액과 남은 기간, 적용 금리를 입력하면 맞춤 갈아타기 분석을 제공합니다. <br />마이데이터 &gt; 자산 탭에서 정보를 먼저 입력해주세요.
          </div>
        )}
        {canEvaluate && loading && <div className="muted">금융상품을 분석하는 중입니다...</div>}
        {canEvaluate && !loading && error && <div className="muted">오류: {error}</div>}
        {canEvaluate && !loading && !error && summary && (
          <div className="grid cols-3" style={{ gap: 12, alignItems: 'stretch' }}>
            <div>
              <div className="muted">판단</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{summary.decision}</div>
            </div>
            <div>
              <div className="muted">예상 순이익</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: summary.net_gain >= 0 ? '#16a34a' : '#f97316' }}>
                {toCurrency(summary.net_gain)}
              </div>
            </div>
            <div>
              <div className="muted">추천 신뢰도</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {confidenceFormatter.format(Math.max(0, Math.min(1, summary.confidence)))}
              </div>
            </div>
          </div>
        )}
      </div>

      {current && (
        <div className="grid cols-2" style={{ gap: 16, marginBottom: 18 }}>
          <div className="card" style={{ minHeight: 220, textAlign: 'left' }}>
            <div className="section-title" style={{ fontSize: 18 }}>현재 보유 적금</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{current.product_name || '상품명 미입력'}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              예치금 {toCurrency(current.principal)} · 남은기간 {current.months_remaining}개월 · 금리 {toPercent(current.annual_rate)}
            </div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
              <div>
                <div className="muted">잔여기간 예상이자</div>
                <div style={{ fontWeight: 700 }}>{toCurrency(current.expected_interest)}</div>
              </div>
              <div>
                <div className="muted">동일기간 유지 시</div>
                <div style={{ fontWeight: 700 }}>
                  {current.expected_interest_same_term != null ? toCurrency(current.expected_interest_same_term) : '-'}
                </div>
              </div>
              <div>
                <div className="muted">중도해지 패널티</div>
                <div style={{ fontWeight: 700, color: current.penalty_amount > 0 ? '#f97316' : '#94a3b8' }}>
                  {toCurrency(current.penalty_amount)}
                  {current.penalty_rate > 0 ? ` (${percentFormatter.format(current.penalty_rate * 100)}%)` : ''}
                </div>
              </div>
            </div>
            <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
              갈아타기 시 패널티를 반영해 순이익을 계산합니다. 잔여 기간 {current.target_term ?? current.months_remaining}개월을 기준으로 비교합니다.
            </div>
          </div>

          <RecommendationCard title="추천 갈아타기 상품" recommendation={best} />
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="section-title" style={{ fontSize: 18, marginBottom: 10 }}>대안 상품 비교</div>
          <div className="grid cols-3" style={{ gap: 12 }}>
            {alternatives.map((item) => (
              <div key={`${item.fin_prdt_cd}-${item.save_term}`} className="card" style={{ textAlign: 'left', background: '#0f172a' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{item.product_name}</div>
                <div className="muted" style={{ marginTop: 4 }}>{item.company_name ?? ''}</div>
                <div className="muted" style={{ marginTop: 10 }}>
                  금리 {item.rate != null ? toPercent(item.rate) : '-'}
                  {item.rate_gain != null && (
                    <span style={{ marginLeft: 4, color: item.rate_gain >= 0 ? '#38bdf8' : '#f97316' }}>
                      ({item.rate_gain >= 0 ? '+' : ''}{percentFormatter.format(item.rate_gain)}%p)
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 12, fontWeight: 700, color: (item.net_gain ?? 0) >= 0 ? '#22c55e' : '#f97316' }}>
                  순이익 {item.net_gain != null ? toCurrency(item.net_gain) : '-'}
                </div>
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                  {item.reasons?.[0] ?? '추천 사유 분석 중'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ textAlign: 'left' }}>
        <div className="section-title" style={{ fontSize: 18, marginBottom: 8 }}>보유 금융상품 현황</div>
        <div className="grid cols-3" style={{ marginBottom: 14 }}>
          <div className="card kpi">
            <div>
              <div className="value">{data.savings.principal.toLocaleString()}원</div>
              <div className="label">적금 잔액</div>
            </div>
            <span className="badge info">마이데이터 입력기준</span>
          </div>
          <div className="card kpi">
            <div>
              <div className="value">{totalLoanAmount.toLocaleString()}원</div>
              <div className="label">대출 잔액</div>
            </div>
            <span className={`badge ${totalLoanAmount > 0 ? 'warn' : 'ok'}`}>{totalLoanAmount > 0 ? '상환 관리 필요' : '부채 없음'}</span>
          </div>
          <div className="card kpi">
            <div>
              <div className="value">{loans.length}건</div>
              <div className="label">등록된 대출</div>
            </div>
            <span className="badge secondary">가계부 업데이트</span>
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="muted">등록된 대출이 없습니다. 필요 시 자산 탭에서 입력 후 갈아타기 옵션을 확인하세요.</div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {loans.map((loan, index) => (
              <div key={`loan-${index}`} className="card" style={{ background: '#0f172a' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{loan.lender}</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  대출금 {loan.amount.toLocaleString()}원 · 금리 {(loan.annualRate * 100).toFixed(2)}% · 잔여 {loan.remainingMonths}개월
                </div>
                {loan.purpose && <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>용도: {loan.purpose}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 20 }}>
        <button type="button" className="btn secondary" onClick={() => navigate('/mydata')}>
          목록으로 돌아가기
        </button>
        <button type="button" className="btn" onClick={() => navigate('/mydata/assets')}>
          자산 입력 화면으로 이동
        </button>
      </div>
    </div>
  )
}
