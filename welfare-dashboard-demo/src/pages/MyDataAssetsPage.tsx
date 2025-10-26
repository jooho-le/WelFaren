import { useMemo } from 'react'
import type { AssetFormData } from '../components/AssetInput'

type PortfolioKey = 'realEstate' | 'deposits' | 'otherAssets'

type PortfolioSlice = {
  key: PortfolioKey
  label: string
  value: number
  color: string
}

const currency = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })

const LABEL_MAP: Record<PortfolioKey, string> = {
  realEstate: '부동산',
  deposits: '예·적금',
  otherAssets: '기타자산',
}

const COLOR_MAP: Record<PortfolioKey, string> = {
  realEstate: '#38bdf8',
  deposits: '#a78bfa',
  otherAssets: '#f97316',
}

const formatCurrency = (amount: number) => currency.format(Math.max(0, Math.round(amount)))

export default function MyDataAssetsPage({
  navigate,
  data,
}: {
  navigate: (path: string) => void
  data: AssetFormData
}) {
  const authed = !!(typeof window !== 'undefined' && localStorage.getItem('authToken'))
  const slices: PortfolioSlice[] = useMemo(() => {
    const safeValue = (key: PortfolioKey) => Math.max(0, data[key] ?? 0)
    return [
      { key: 'realEstate', label: LABEL_MAP.realEstate, value: safeValue('realEstate'), color: COLOR_MAP.realEstate },
      { key: 'deposits', label: LABEL_MAP.deposits, value: safeValue('deposits'), color: COLOR_MAP.deposits },
      { key: 'otherAssets', label: LABEL_MAP.otherAssets, value: safeValue('otherAssets'), color: COLOR_MAP.otherAssets },
    ]
  }, [data.deposits, data.otherAssets, data.realEstate])

  const totalAsset = useMemo(() => slices.reduce((sum, slice) => sum + slice.value, 0), [slices])
  const householdSize = Math.max(1, data.householdSize || 1)
  const assetPerCapita = totalAsset / householdSize

const liquidityRatio = useMemo(() => {
  const cashable = (data.deposits ?? 0) + (data.otherAssets ?? 0)
  return totalAsset > 0 ? Math.min(1, cashable / totalAsset) : 0
}, [data.deposits, data.otherAssets, totalAsset])

const incomeCoverage = useMemo(() => {
  const monthlyIncome = Math.max(0, data.monthlyIncome ?? 0)
  const yearlyIncome = monthlyIncome * 12
  return yearlyIncome > 0 ? totalAsset / yearlyIncome : 0
}, [data.monthlyIncome, totalAsset])

  const incomeRecognition = useMemo(() => {
    const earned = (data.monthlyIncome ?? 0) * 0.7
    const propertyConv = ((data.realEstate ?? 0) * 0.04) / 12
    const depositConv = ((data.deposits ?? 0) * 0.02) / 12
    const otherConv = ((data.otherAssets ?? 0) * 0.03) / 12
    const total = Math.round(earned + propertyConv + depositConv + otherConv)
    const perCapita = Math.round(total / Math.max(1, data.householdSize || 1))
    return { total, perCapita }
  }, [data.deposits, data.householdSize, data.monthlyIncome, data.otherAssets, data.realEstate])

  const donutStyle = useMemo(() => {
    if (totalAsset <= 0) return { background: '#0f172a' }
    let cursor = 0
    const segments = slices
      .filter((slice) => slice.value > 0)
      .map((slice) => {
        const start = cursor
        const percent = slice.value / totalAsset
        cursor += percent
        return `${slice.color} ${(start * 360).toFixed(2)}deg ${(cursor * 360).toFixed(2)}deg`
      })
    return segments.length ? { background: `conic-gradient(${segments.join(', ')})` } : { background: '#0f172a' }
  }, [slices, totalAsset])

  const maxSlice = useMemo(() => {
    const max = Math.max(...slices.map((slice) => slice.value))
    return max > 0 ? max : 1
  }, [slices])

  const liquidityPercent = Math.round(liquidityRatio * 100)
  const realEstateShare = totalAsset > 0 ? Math.round(((data.realEstate ?? 0) / totalAsset) * 100) : 0
  const loans = data.loans ?? []
  const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0)
  const recognitionTenThousands = Math.max(0, Math.round(incomeRecognition.total / 10_000))
  const recognitionRatio = Math.min(1, incomeRecognition.total / 4_000_000)

  return (
    <div className="panel">
      <div className="section-title" style={{ fontSize: 32, textAlign: 'center' }}>자산 포트폴리오 현황</div>
      {!authed && (
        <div className="muted" style={{ textAlign: 'center', marginBottom: 10, fontSize: 12 }}>
          마이데이터 연동 전에는 예시 데이터가 표시됩니다. 상단 입력 영역에서 자산을 직접 수정할 수 있습니다.
        </div>
      )}
      <div className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>
        자산 구성을 시각화하고 유동성 및 대출 현황을 한 번에 확인하세요.
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 18, border: '1px solid #d1fae5', background: '#f0fdf4' }}>
        <div className="section-title" style={{ fontSize: 18, marginBottom: 6 }}>소득인정액</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{recognitionTenThousands.toLocaleString()}</div>
          <div className="muted" style={{ fontSize: 14 }}>만원</div>
          <div className="muted" style={{ marginLeft: 12, fontSize: 13 }}>
            1인당 {Math.max(0, Math.round(incomeRecognition.perCapita / 10_000)).toLocaleString()}만원
          </div>
        </div>
        <div className="asset-liquidity" style={{ marginTop: 12 }}>
          <div className="asset-liquidity-track" style={{ background: '#dcfce7' }}>
            <div className="asset-liquidity-fill" style={{ width: `${Math.round(recognitionRatio * 100)}%`, background: '#22c55e' }} />
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          백엔드 계산값(소득인정액) 기준 · 가구원 수와 자산 입력을 바탕으로 산출됩니다.
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card kpi">
          <div>
            <div className="value">{formatCurrency(totalAsset)}</div>
            <div className="label">총 자산</div>
          </div>
          <span className="badge info">마이데이터</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{formatCurrency(assetPerCapita)}</div>
            <div className="label">1인당 자산</div>
          </div>
          <span className="badge secondary">가구원 {householdSize}명</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{incomeCoverage.toFixed(1)}배</div>
            <div className="label">연소득 대비 자산</div>
          </div>
          <span className={`badge ${incomeCoverage >= 12 ? 'ok' : 'warn'}`}>
            {incomeCoverage >= 12 ? '안정' : '점검 필요'}
          </span>
        </div>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'stretch' }}>
        <div className="card asset-card">
          <div className="section-title" style={{ fontSize: 16 }}>포트폴리오 비중</div>
          <div className="asset-donut" style={donutStyle}>
            <div className="asset-donut-value">
              <div>{liquidityPercent}%</div>
              <span>유동성 비중</span>
            </div>
          </div>
          <div className="asset-legend">
            {slices.map((slice) => {
              const share = totalAsset > 0 ? (slice.value / totalAsset) * 100 : 0
              return (
                <div key={slice.key} className="asset-legend-item">
                  <div className="asset-legend-left">
                    <span className="asset-legend-dot" style={{ background: slice.color }} />
                    <div>
                      <div className="asset-legend-label">{slice.label}</div>
                      <div className="asset-legend-value">{formatCurrency(slice.value)}</div>
                    </div>
                  </div>
                  <div className="asset-legend-share">{share.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card asset-card">
          <div className="section-title" style={{ fontSize: 16 }}>자산 영역 그래프</div>
          <div className="asset-bars">
            {slices.map((slice) => {
              const width = Math.round((slice.value / maxSlice) * 100)
              return (
                <div key={`bar-${slice.key}`} className="asset-bar-row">
                  <div className="asset-bar-label">{slice.label}</div>
                  <div className="asset-bar-track">
                    <div className="asset-bar-fill" style={{ width: `${width}%`, background: slice.color }} />
                  </div>
                  <div className="asset-bar-value">{formatCurrency(slice.value)}</div>
                </div>
              )
            })}
          </div>

          <div className="section-title" style={{ fontSize: 14, marginTop: 18 }}>유동성 지수</div>
          <div className="asset-liquidity">
            <div className="asset-liquidity-track">
              <div className="asset-liquidity-fill" style={{ width: `${liquidityPercent}%` }} />
            </div>
            <div className="asset-liquidity-detail">
              <span>단기 현금화 자산</span>
              <strong>{liquidityPercent}%</strong>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              예·적금과 기타 유동성 자산 비중이 40% 이상이면 단기 자금 운용이 비교적 안정적입니다.
            </div>
          </div>

          <div className="section-title" style={{ fontSize: 14, marginTop: 14 }}>포트폴리오 인사이트</div>
          <div className="asset-insights">
            <div className="asset-insight-item">
              <div className="asset-insight-key">부동산 비중</div>
              <div className="asset-insight-val">{realEstateShare}%</div>
              <div className="asset-insight-desc">전체 자산 중 부동산이 차지하는 비율입니다.</div>
            </div>
            <div className="asset-insight-item">
              <div className="asset-insight-key">자산 안전도</div>
              <div className="asset-insight-val">{incomeCoverage.toFixed(1)}배</div>
              <div className="asset-insight-desc">연소득 대비 보유 자산 배수로 10배 이상이면 안정 구간으로 봅니다.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>대출 현황</div>
        {loans.length === 0 ? (
          <div className="muted">등록된 대출이 없습니다. 상단 입력 영역에서 필요 시 추가하세요.</div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {loans.map((loan, index) => (
              <div key={`loan-${index}`} className="card" style={{ background: '#0f172a' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{loan.lender}</div>
                  <span className="badge info">잔여 {loan.remainingMonths}개월</span>
                </div>
                <div className="muted" style={{ marginTop: 6 }}>
                  연 {(loan.annualRate * 100).toFixed(2)}%
                  {loan.purpose ? ` · 용도 ${loan.purpose}` : ''}
                </div>
                <div style={{ marginTop: 10, fontSize: 24, fontWeight: 800 }}>{loan.amount.toLocaleString()}원</div>
              </div>
            ))}
          </div>
        )}
        <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
          대출 정보 수정이 필요하면 상단의 자산 입력 영역으로 이동해 업데이트하세요. 총 대출 잔액: {totalLoanAmount.toLocaleString()}원
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button type="button" className="btn secondary" onClick={() => navigate('/mydata')}>
          뒤로가기
        </button>
      </div>
    </div>
  )
}
