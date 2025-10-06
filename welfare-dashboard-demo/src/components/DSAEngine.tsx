import type { AssetFormData } from './AssetInput'

type MarketOption = {
  name: string
  annualRate: number
  minMonths: number
}

// Static market options for demo
const MARKET: MarketOption[] = [
  { name: '자유적금 A', annualRate: 0.039, minMonths: 3 },
  { name: '특판적금 B', annualRate: 0.042, minMonths: 6 },
  { name: '온라인전용 C', annualRate: 0.044, minMonths: 6 },
]

function interestForMonths(principal: number, annualRate: number, months: number) {
  return principal * annualRate * (months / 12)
}

export default function DSAEngine({ data, onBack }: { data: AssetFormData, onBack: () => void }) {
  const current = data.savings
  const currentRemainInterest = interestForMonths(current.principal, current.annualRate, current.monthsRemaining)
  const penalty = current.principal * current.earlyTerminatePenaltyRate

  // Compare best option that meets remaining months
  const viable = MARKET.filter(m => m.minMonths <= current.monthsRemaining)
  const best = viable.sort((a, b) => b.annualRate - a.annualRate)[0] || MARKET[0]
  const bestInterest = interestForMonths(current.principal, best.annualRate, current.monthsRemaining)
  const netGain = Math.round(bestInterest - currentRemainInterest - penalty)

  const gainPct = Math.max(0, Math.min(1, (netGain + penalty) / Math.max(1, currentRemainInterest + penalty)))

  return (
    <div>
      <div className="section-title">금융 갈아타기 추천(DSA)</div>
      <div className="grid cols-2">
        <div className="card">
          <div className="muted">현재 상품</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{current.productName}</div>
          <div className="grid cols-3" style={{ marginTop: 8 }}>
            <div>
              <div className="muted">연 금리</div>
              <div style={{ fontWeight: 700 }}>{(current.annualRate * 100).toFixed(2)}%</div>
            </div>
            <div>
              <div className="muted">잔여 기간</div>
              <div style={{ fontWeight: 700 }}>{current.monthsRemaining}개월</div>
            </div>
            <div>
              <div className="muted">원금</div>
              <div style={{ fontWeight: 700 }}>{current.principal.toLocaleString()}원</div>
            </div>
          </div>
          <div className="spacer" />
          <div className="grid cols-2">
            <div>
              <div className="muted">잔여 이자(가정)</div>
              <div style={{ fontWeight: 800 }}>{Math.round(currentRemainInterest).toLocaleString()}원</div>
            </div>
            <div>
              <div className="muted">중도해지 페널티</div>
              <div style={{ fontWeight: 800, color: 'var(--danger)' }}>-{Math.round(penalty).toLocaleString()}원</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="muted">추천 대안</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{best.name}</div>
          <div className="grid cols-3" style={{ marginTop: 8 }}>
            <div>
              <div className="muted">연 금리</div>
              <div style={{ fontWeight: 700, color: 'var(--ok)' }}>{(best.annualRate * 100).toFixed(2)}%</div>
            </div>
            <div>
              <div className="muted">적용 기간</div>
              <div style={{ fontWeight: 700 }}>{current.monthsRemaining}개월</div>
            </div>
            <div>
              <div className="muted">예상 이자</div>
              <div style={{ fontWeight: 800 }}>{Math.round(bestInterest).toLocaleString()}원</div>
            </div>
          </div>

          <div className="spacer" />
          <div className="muted">갈아타기 순이익(이자차익 - 페널티)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: netGain >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
              {(netGain >= 0 ? '+' : '') + netGain.toLocaleString()}원
            </div>
            <span className={`badge ${netGain >= 0 ? 'ok' : 'warn'}`}>{netGain >= 0 ? '갈아타기 권장' : '유지 권장'}</span>
          </div>

          <div className="spacer" />
          <div className="chart" title="순이익/총비용 비율(가정)">
            <div className="bar" style={{ width: `${Math.max(10, gainPct * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="spacer" />
      <div className="card">
        <div className="section-title">시장 옵션 비교</div>
        <div className="grid cols-3">
          {MARKET.map((m) => {
            const est = Math.round(interestForMonths(current.principal, m.annualRate, current.monthsRemaining))
            return (
              <div key={m.name} className="card">
                <div style={{ fontWeight: 700 }}>{m.name}</div>
                <div className="muted">연 { (m.annualRate*100).toFixed(2) }% · 최소 {m.minMonths}개월</div>
                <div className="spacer" />
                <div className="muted">현재 잔여기간 적용 시 예상 이자</div>
                <div style={{ fontWeight: 800 }}>{est.toLocaleString()}원</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn secondary" onClick={onBack}>이전 · 복지 결과</button>
      </div>
    </div>
  )
}

