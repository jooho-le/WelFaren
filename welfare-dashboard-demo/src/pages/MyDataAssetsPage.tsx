import { useMemo } from 'react'
import type { AssetFormData } from '../components/AssetInput'

type PortfolioSlice = {
  key: 'realEstate' | 'deposits' | 'otherAssets'
  label: string
  value: number
  color: string
}

const colorMap: Record<PortfolioSlice['key'], string> = {
  realEstate: '#38bdf8',
  deposits: '#a78bfa',
  otherAssets: '#f97316'
}

const labelMap: Record<PortfolioSlice['key'], string> = {
  realEstate: '부동산',
  deposits: '예·적금',
  otherAssets: '기타자산'
}

const formatCurrency = (value: number) => `${value.toLocaleString()}원`

export default function MyDataAssetsPage({ navigate, data }: { navigate: (p: string) => void, data: AssetFormData }) {
  const authed = !!(typeof localStorage !== 'undefined' && localStorage.getItem('authToken'))
  const slices: PortfolioSlice[] = useMemo(() => ([
    { key: 'realEstate', label: labelMap.realEstate, value: Math.max(0, data.realEstate || 0), color: colorMap.realEstate },
    { key: 'deposits', label: labelMap.deposits, value: Math.max(0, data.deposits || 0), color: colorMap.deposits },
    { key: 'otherAssets', label: labelMap.otherAssets, value: Math.max(0, data.otherAssets || 0), color: colorMap.otherAssets }
  ]), [data.deposits, data.otherAssets, data.realEstate])

  const totalAsset = useMemo(() => slices.reduce((sum, slice) => sum + slice.value, 0), [slices])

  const assetPerCapita = useMemo(() => {
    const household = Math.max(1, data.householdSize || 1)
    return totalAsset / household
  }, [data.householdSize, totalAsset])

  const liquidityRatio = useMemo(() => {
    const liquid = (data.deposits || 0) + (data.otherAssets || 0)
    return totalAsset > 0 ? liquid / totalAsset : 0
  }, [data.deposits, data.otherAssets, totalAsset])

  const incomeCoverage = useMemo(() => {
    const income = Math.max(1, data.monthlyIncome || 0)
    return totalAsset / income
  }, [data.monthlyIncome, totalAsset])

  const donutStyle = useMemo(() => {
    if (totalAsset <= 0) {
      return { background: '#111827' }
    }
    let cumulative = 0
    const stops = slices
      .filter((slice) => slice.value > 0)
      .map((slice) => {
        const start = cumulative
        const portion = slice.value / totalAsset
        cumulative += portion
        return `${slice.color} ${(start * 360).toFixed(2)}deg ${(cumulative * 360).toFixed(2)}deg`
      })
      .join(', ')
    return stops ? { background: `conic-gradient(${stops})` } : { background: '#111827' }
  }, [slices, totalAsset])

  const maxSliceValue = useMemo(() => {
    const max = Math.max(...slices.map((slice) => slice.value))
    return max > 0 ? max : 1
  }, [slices])

  return (
    <div className="panel">
      <div className="section-title" style={{ fontSize: 32, textAlign: 'center' }}>자산 포트폴리오 현황</div>
      {!authed && (
        <div className="muted" style={{ textAlign: 'center', marginBottom: 10, fontSize: 12, opacity: 0.8 }}>
          해당 내용은 예시입니다. 회원가입/로그인 후 본인의 정보를 확인할 수 있습니다.
        </div>
      )}
      <div className="muted" style={{ textAlign: 'center', marginBottom: 18 }}>
        마이데이터로 수집된 자산 구성을 시각화해 전체 포트폴리오 비중과 유동성 상태를 확인할 수 있습니다.
      </div>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card kpi">
          <div>
            <div className="value">{formatCurrency(Math.round(totalAsset))}</div>
            <div className="label">총 자산</div>
          </div>
          <span className="badge info">마이데이터</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{formatCurrency(Math.round(assetPerCapita))}</div>
            <div className="label">1인당 자산</div>
          </div>
          <span className="badge secondary">가구원 {Math.max(1, data.householdSize || 1)}명</span>
        </div>
        <div className="card kpi">
          <div>
            <div className="value">{incomeCoverage.toFixed(1)}배</div>
            <div className="label">월소득 대비 자산</div>
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
              {totalAsset > 0 ? (
                <>
                  <div>{Math.round(liquidityRatio * 100)}%</div>
                  <span>유동성 비중</span>
                </>
              ) : (
                <>
                  <div>0%</div>
                  <span>등록된 자산 없음</span>
                </>
              )}
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
                      <div className="asset-legend-value">{formatCurrency(Math.round(slice.value))}</div>
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
              const width = Math.round((slice.value / maxSliceValue) * 100)
              return (
                <div key={`bar-${slice.key}`} className="asset-bar-row">
                  <div className="asset-bar-label">{slice.label}</div>
                  <div className="asset-bar-track">
                    <div className="asset-bar-fill" style={{ width: `${width}%`, background: slice.color }} />
                  </div>
                  <div className="asset-bar-value">{formatCurrency(Math.round(slice.value))}</div>
                </div>
              )
            })}
          </div>

          <div className="section-title" style={{ fontSize: 14, marginTop: 18 }}>유동성 지수</div>
          <div className="asset-liquidity">
            <div className="asset-liquidity-track">
              <div className="asset-liquidity-fill" style={{ width: `${Math.round(liquidityRatio * 100)}%` }} />
            </div>
            <div className="asset-liquidity-detail">
              <span>단기 현금화 자산</span>
              <strong>{Math.round(liquidityRatio * 100)}%</strong>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              예·적금 및 기타 유동자산의 비율로, 40% 이상이면 단기 유동성 확보가 수월합니다.
            </div>
          </div>

          <div className="section-title" style={{ fontSize: 14, marginTop: 14 }}>포트폴리오 인사이트</div>
          <div className="asset-insights">
            <div className="asset-insight-item">
              <div className="asset-insight-key">부동산 비중</div>
              <div className="asset-insight-val">
                {totalAsset > 0 ? Math.round((data.realEstate || 0) / totalAsset * 100) : 0}%
              </div>
              <div className="asset-insight-desc">전체 자산에서 실물자산이 차지하는 비중입니다.</div>
            </div>
            <div className="asset-insight-item">
              <div className="asset-insight-key">자산 증가 여력</div>
              <div className="asset-insight-val">{incomeCoverage.toFixed(1)}배</div>
              <div className="asset-insight-desc">월소득 대비 누적 자산 배수입니다. 10배 이상이면 안정 구간입니다.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn secondary" onClick={() => navigate('/mydata')}>뒤로가기</button>
      </div>
    </div>
  )
}
