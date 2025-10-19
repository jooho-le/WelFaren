import React, { useMemo, useState } from 'react'
import type { AssetFormData, SavingsInfo } from '../components/AssetInput'

const emptyDraft = {
  productName: '',
  principal: '',
  annualRate: '',
  monthsRemaining: '',
  earlyTerminatePenaltyRate: ''
}

type Draft = typeof emptyDraft

export default function SavingsOverview({ navigate, data }: { navigate: (p: string) => void, data: AssetFormData }) {
  const baseItems: SavingsInfo[] = useMemo(() => {
    const s = data?.savings
    return s ? [s] : []
  }, [data])

  const [customItems, setCustomItems] = useState<SavingsInfo[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const items = useMemo(() => [...baseItems, ...customItems], [baseItems, customItems])

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

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const resetDraft = () => {
    setDraft(emptyDraft)
    setError(null)
  }

  const addSavings = () => {
    const principal = Number(draft.principal)
    const annualRate = Number(draft.annualRate)
    const monthsRemaining = Number(draft.monthsRemaining)
    const penalty = Number(draft.earlyTerminatePenaltyRate)

    if (!draft.productName.trim()) {
      setError('상품명을 입력해 주세요.')
      return
    }
    if (!Number.isFinite(principal) || principal <= 0) {
      setError('원금은 0보다 큰 숫자로 입력해 주세요.')
      return
    }
    if (!Number.isFinite(annualRate) || annualRate < 0) {
      setError('연 금리는 0 이상의 숫자로 입력해 주세요.')
      return
    }
    if (!Number.isFinite(monthsRemaining) || monthsRemaining < 0) {
      setError('잔여 기간은 0 이상의 숫자로 입력해 주세요.')
      return
    }
    const newItem: SavingsInfo = {
      productName: draft.productName.trim(),
      principal,
      annualRate: annualRate / 100,
      monthsRemaining,
      earlyTerminatePenaltyRate: Math.max(0, penalty) / 100
    }
    setCustomItems((prev) => [...prev, newItem])
    resetDraft()
    setShowModal(false)
  }

  const removeCustom = (index: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="grid">
      <div className="panel savings-total">
        <div className="section-title">현재 적금 총액</div>
        <div className="amount-big">{summary.principal.toLocaleString()}원</div>
        <div className="muted">만기 예상금액 {summary.maturity.toLocaleString()}원 · 평균 이자율 {(summary.avgRate * 100).toFixed(2)}%</div>
        <div className="row savings-total-actions">
          <button className="btn" onClick={() => { resetDraft(); setShowModal(true) }}>적금 추가</button>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => { setShowModal(false); resetDraft() }}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">새 적금 추가</div>
              <button className="modal-close" aria-label="닫기" onClick={() => { setShowModal(false); resetDraft() }}>닫기</button>
            </div>
            <div className="grid cols-2 savings-form-grid">
              <div>
                <label>상품명</label>
                <input className="input" value={draft.productName} onChange={(e) => updateDraft('productName', e.target.value)} placeholder="예: 청년 미래드림 적금" />
              </div>
              <div>
                <label>원금(원)</label>
                <input className="input" type="number" value={draft.principal} onChange={(e) => updateDraft('principal', e.target.value)} placeholder="예: 3000000" />
              </div>
              <div>
                <label>연 금리(%)</label>
                <input className="input" type="number" step="0.01" value={draft.annualRate} onChange={(e) => updateDraft('annualRate', e.target.value)} placeholder="예: 3.1" />
              </div>
              <div>
                <label>잔여 기간(개월)</label>
                <input className="input" type="number" value={draft.monthsRemaining} onChange={(e) => updateDraft('monthsRemaining', e.target.value)} placeholder="예: 10" />
              </div>
              <div>
                <label>중도해지 페널티(%)</label>
                <input className="input" type="number" step="0.1" value={draft.earlyTerminatePenaltyRate} onChange={(e) => updateDraft('earlyTerminatePenaltyRate', e.target.value)} placeholder="예: 1" />
              </div>
            </div>
            <div className="row modal-actions">
              {error && <div className="form-error">{error}</div>}
              <div className="modal-gap" />
              <button className="btn secondary" onClick={() => { setShowModal(false); resetDraft() }}>취소</button>
              <button className="btn" onClick={addSavings}>저장</button>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="section-title">종류별 금액</div>
        {items.length === 0 && (
          <div className="muted">등록된 적금이 없습니다. 위 입력창에서 직접 추가해 보세요.</div>
        )}
        <div className="savings-list">
          {items.map((s, i) => {
            const isCustom = i >= baseItems.length
            const months = Math.max(0, s.monthsRemaining || 0)
            const maturity = Math.round((s.principal || 0) * (1 + (s.annualRate || 0) * (months / 12)))
            return (
              <div key={i} className="savings-item card">
                <div className="s-item-head">
                  <div className="s-name">
                    {s.productName || '적금 상품'}
                    {isCustom && <span className="s-tag">직접 입력</span>}
                  </div>
                  <div className="s-head-actions">
                    <span className="badge info">잔여 {months}개월</span>
                    {isCustom && (
                      <button className="s-remove" onClick={() => removeCustom(i - baseItems.length)}>
                        삭제
                      </button>
                    )}
                  </div>
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
