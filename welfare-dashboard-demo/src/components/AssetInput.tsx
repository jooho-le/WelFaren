import { useMemo } from 'react'

export type SavingsInfo = {
  productName: string
  principal: number
  annualRate: number // e.g. 0.035
  monthsRemaining: number
  earlyTerminatePenaltyRate: number // e.g. 0.01 (1% of principal)
  penalty?: number
}

export type LoanInfo = {
  lender: string
  amount: number
  annualRate: number
  remainingMonths: number
  purpose?: string
}

export type AssetFormData = {
  monthlyIncome: number
  householdSize: number
  realEstate: number
  deposits: number
  otherAssets: number
  savings: SavingsInfo
  loans: LoanInfo[]
}

export default function AssetInput({ value, onChange, onNext }: {
  value: AssetFormData,
  onChange: (v: AssetFormData) => void,
  onNext?: () => void,
}) {
  const totalAssets = useMemo(() => value.realEstate + value.deposits + value.otherAssets, [value])

  const set = <K extends keyof AssetFormData>(key: K, v: AssetFormData[K]) => {
    onChange({ ...value, [key]: v })
  }

  const setSv = <K extends keyof SavingsInfo>(key: K, v: SavingsInfo[K]) => {
    onChange({ ...value, savings: { ...value.savings, [key]: v } })
  }

  return (
    <div className="grid">
      <div>
        <div className="section-title">1) 소득 · 가구 정보</div>
        <div className="grid">
          <div>
            <label>월 소득(세전)</label>
            <input className="input" type="number" value={value.monthlyIncome}
              onChange={(e) => set('monthlyIncome', Number(e.target.value || 0))}
              placeholder="예: 2800000" />
          </div>
          <div>
            <label>가구원 수</label>
            <input className="input" type="number" value={value.householdSize}
              onChange={(e) => set('householdSize', Math.max(1, Number(e.target.value || 1)))} />
          </div>
        </div>

        <div className="spacer" />

        <div className="section-title">2) 자산 정보</div>
        <div className="grid">
          <div>
            <label>부동산 평가액</label>
            <input className="input" type="number" value={value.realEstate}
              onChange={(e) => set('realEstate', Number(e.target.value || 0))}
              placeholder="예: 120000000" />
          </div>
          <div>
            <label>예·적금 잔액</label>
            <input className="input" type="number" value={value.deposits}
              onChange={(e) => set('deposits', Number(e.target.value || 0))}
              placeholder="예: 15000000" />
          </div>
          <div>
            <label>기타 자산</label>
            <input className="input" type="number" value={value.otherAssets}
              onChange={(e) => set('otherAssets', Number(e.target.value || 0))}
              placeholder="예: 2000000" />
          </div>
        </div>

        <div className="spacer" />
        <div className="card">
          <div className="kpi">
            <div>
              <div className="value">{totalAssets.toLocaleString()}원</div>
              <div className="label">자산 합계</div>
            </div>
            <span className="badge info">입력 미세조정 가능</span>
          </div>
        </div>
      </div>

      <div>
        <div className="section-title">3) 보유 적금(DSA 분석용)</div>
        <div className="grid">
          <div>
            <label>상품명</label>
            <input className="input" value={value.savings.productName}
              onChange={(e) => setSv('productName', e.target.value)} />
          </div>
          <div>
            <label>잔여 기간(개월)</label>
            <input className="input" type="number" value={value.savings.monthsRemaining}
              onChange={(e) => setSv('monthsRemaining', Number(e.target.value || 0))} />
          </div>
          <div>
            <label>연 금리(%)</label>
            <input className="input" type="number" step="0.01" value={value.savings.annualRate * 100}
              onChange={(e) => setSv('annualRate', Number(e.target.value || 0) / 100)} />
          </div>
          <div>
            <label>원금(원)</label>
            <input className="input" type="number" value={value.savings.principal}
              onChange={(e) => setSv('principal', Number(e.target.value || 0))} />
          </div>
          <div>
            <label>중도해지 페널티(% 원금 기준)</label>
            <input className="input" type="number" step="0.1" value={value.savings.earlyTerminatePenaltyRate * 100}
              onChange={(e) => setSv('earlyTerminatePenaltyRate', Number(e.target.value || 0) / 100)} />
          </div>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" onClick={onNext}>복지 추천 보기</button>
          <button className="btn secondary" onClick={() => navigator.clipboard?.writeText(JSON.stringify(value, null, 2))}>현재 입력 복사</button>
        </div>
      </div>
    </div>
  )
}
