import React, { useMemo } from 'react'
import type { AssetFormData, SavingsInfo } from '../components/AssetInput'

export default function SavingsOverview({ navigate, data }: { navigate: (p: string) => void, data: AssetFormData }) {
  // In this demo we keep a single savings item. Treat as list for future extensibility.
  const items: SavingsInfo[] = useMemo(() => {
    const s = data?.savings
    return s ? [s] : []
  }, [data])

  const summary = useMemo(() => {
    if (!items.length) return { principal: 0, maturity: 0, avgRate: 0 }
    const totalPrincipal = items.reduce((a, b) => a + (b.principal || 0), 0)
    const totalMaturity = items.reduce((a, b) => {
      const months = Math.max(0, b.monthsRemaining || 0)
      const maturity = (b.principal || 0) * (1 + (b.annualRate || 0) * (months / 12))
      return a + maturity
    }, 0)
    const avgRate = totalPrincipal > 0
      ? items.reduce((a, b) => a + (b.annualRate || 0) * (b.principal || 0), 0) / totalPrincipal
      : 0
    return { principal: Math.round(totalPrincipal), maturity: Math.round(totalMaturity), avgRate }
  }, [items])

  return (
    <div className="grid">
      <div className="panel savings-total">
        <div className="section-title">현재 적금 총액</div>
        <div className="amount-big">{summary.principal.toLocaleString()}원</div>
        <div className="muted">만기 예상금액 {summary.maturity.toLocaleString()}원 · 평균 이자율 {(summary.avgRate * 100).toFixed(2)}%</div>
      </div>

      <div className="panel">
        <div className="section-title">종류별 금액</div>
        {items.length === 0 && (
          <div className="muted">등록된 적금이 없습니다. 프로필/마이데이터에서 입력해 주세요.</div>
        )}
        <div className="savings-list">
          {items.map((s, i) => {
            const months = Math.max(0, s.monthsRemaining || 0)
            const maturity = Math.round((s.principal || 0) * (1 + (s.annualRate || 0) * (months / 12)))
            return (
              <div key={i} className="savings-item card">
                <div className="s-item-head">
                  <div className="s-name">{s.productName || '적금 상품'}</div>
                  <span className="badge info">잔여 {months}개월</span>
                </div>
                <div className="s-grid">
                  <div>
                    <div className="s-label">납입금액</div>
                    <div className="s-value">{(s.principal || 0).toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="s-label">만기금액(예상)</div>
                    <div className="s-value">{maturity.toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="s-label">이자율(연)</div>
                    <div className="s-value">{((s.annualRate || 0) * 100).toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
 
     
      </div>
    </div>
  )
}

