import { useEffect, useMemo, useState } from 'react'
import AssetInput, { AssetFormData } from './components/AssetInput'
import WelfareResults from './components/WelfareResults'
import DSAEngine from './components/DSAEngine'
import HomeButton from './components/HomeButton'
import HomeLanding from './pages/HomeLanding'
import SearchPage from './pages/SearchPage'
import ConsultPage from './pages/ConsultPage'
import TransferPage from './pages/TransferPage'
import MyDataPage from './pages/MyDataPage'
import ProfileSelectPage from './pages/ProfileSelectPage'
import RegionSelect from './pages/select/RegionSelect'
import JobSelect from './pages/select/JobSelect'
import AgeSelect from './pages/select/AgeSelect'
import PrefSelect from './pages/select/PrefSelect'
import WelfareHub from './pages/WelfareHub'
import FinanceHub from './pages/FinanceHub'
import WelfareCategory from './pages/WelfareCategory'

type Step = 0 | 1 | 2

const defaultData: AssetFormData = {
  monthlyIncome: 2800000,
  householdSize: 2,
  realEstate: 120_000_000,
  deposits: 15_000_000,
  otherAssets: 2_000_000,
  savings: {
    productName: '청년 희망적금',
    principal: 5_000_000,
    annualRate: 0.034,
    monthsRemaining: 8,
    earlyTerminatePenaltyRate: 0.015
  }
}

export default function App() {
  const [route, setRoute] = useState<string>(() => (location.hash.slice(1) || '/'))
  const [step, setStep] = useState<Step>(0)
  const [data, setData] = useState<AssetFormData>(defaultData)
  useEffect(() => {
    const onHash = () => setRoute(location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const navigate = (p: string) => { if (!p.startsWith('/')) p = '/' + p; location.hash = p }

  const incomeRecognition = useMemo(() => {
    // Simplified 인정소득: 근로소득 70% + 재산의 소득환산(연 4%/12) + 기타자산 환산
    const earned = data.monthlyIncome * 0.7
    const propertyConv = (data.realEstate * 0.04) / 12
    const depositConv = (data.deposits * 0.02) / 12
    const otherConv = (data.otherAssets * 0.03) / 12
    const total = Math.round(earned + propertyConv + depositConv + otherConv)
    const perCapita = Math.round(total / Math.max(1, data.householdSize))
    return { total, perCapita }
  }, [data])

  const welfare = useMemo(() => {
    // Demo thresholds (fictional):
    // - 기초생활수급 가능성: 가구원 1인당 인정소득 < 700,000
    // - 서민금융(햇살론 등): 가구인정소득 < 2,500,000 또는 청년/신혼부부 가점(데모에서는 미적용)
    const baseEligible = incomeRecognition.perCapita < 700_000
    const microFinanceEligible = incomeRecognition.total < 2_500_000
    return { baseEligible, microFinanceEligible }
  }, [incomeRecognition])

  // Router: map routes to views
  const renderRoute = () => {
    if (route === '/') return <HomeLanding navigate={navigate} />
    if (route === '/search') return <SearchPage navigate={navigate} />
    if (route === '/consult') return (
      <ConsultPage
        data={data} setData={setData}
        step={step} setStep={setStep}
        incomeRecognition={incomeRecognition}
        eligibility={welfare}
        navigate={navigate}
      />
    )
    if (route === '/transfer') return <TransferPage navigate={navigate} />
    if (route === '/mydata') return <MyDataPage navigate={navigate} />
    if (route === '/profile') return <ProfileSelectPage navigate={navigate} />
    if (route === '/select/region') return <RegionSelect navigate={navigate} />
    if (route === '/select/job') return <JobSelect navigate={navigate} />
    if (route === '/select/age') return <AgeSelect navigate={navigate} />
    if (route === '/select/pref') return <PrefSelect navigate={navigate} />
    if (route === '/hub/welfare') return <WelfareHub navigate={navigate} />
    if (route === '/hub/finance') return <FinanceHub navigate={navigate} />
    if (route.startsWith('/welfare/')) {
      const name = decodeURIComponent(route.replace('/welfare/', ''))
      return <WelfareCategory navigate={navigate} name={name} />
    }
    if (route.startsWith('/wizard/')) {
      const n = Number(route.replace('/wizard/', ''))
      if (n === 0 || n === 1 || n === 2) setTimeout(() => setStep(n as Step), 0)
      return (
        <div>
          <div className="stepper">
            <div className={`step ${step === 0 ? 'active' : ''}`}>① 자산 입력</div>
            <div className={`step ${step === 1 ? 'active' : ''}`}>② 복지 추천 결과</div>
            <div className={`step ${step === 2 ? 'active' : ''}`}>③ 금융 갈아타기 추천</div>
          </div>

          {step === 0 && (
            <div className="panel">
              <AssetInput value={data} onChange={setData} onNext={() => { setStep(1); navigate('/wizard/1') }} />
            </div>
          )}
          {step === 1 && (
            <div className="grid cols-2">
              <div className="panel">
                <WelfareResults data={data} incomeRecognition={incomeRecognition} eligibility={welfare} />
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn secondary" onClick={() => { setStep(0); navigate('/wizard/0') }}>이전</button>
                  <button className="btn" onClick={() => { setStep(2); navigate('/wizard/2') }}>다음 · DSA 추천</button>
                </div>
              </div>
              <div className="panel">
                <div className="section-title">요약 KPI</div>
                <div className="grid cols-3">
                  <div className="card kpi">
                    <div>
                      <div className="value">{incomeRecognition.total.toLocaleString()}원</div>
                      <div className="label">월 소득인정액</div>
                    </div>
                    <span className={`badge ${welfare.baseEligible ? 'ok' : 'warn'}`}>{welfare.baseEligible ? '기초생활 가능성' : '기초생활 기준 초과'}</span>
                  </div>
                  <div className="card kpi">
                    <div>
                      <div className="value">{incomeRecognition.perCapita.toLocaleString()}원</div>
                      <div className="label">1인당 인정소득</div>
                    </div>
                    <span className={`badge ${welfare.microFinanceEligible ? 'ok' : 'warn'}`}>{welfare.microFinanceEligible ? '서민금융 가능성' : '서민금융 기준 초과'}</span>
                  </div>
                  <div className="card kpi">
                    <div>
                      <div className="value">{data.householdSize}명</div>
                      <div className="label">가구원 수</div>
                    </div>
                    <span className="badge info">정보 입력</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="panel">
              <DSAEngine data={data} onBack={() => { setStep(1); navigate('/wizard/1') }} />
            </div>
          )}
        </div>
      )
    }
    return <div className="muted">페이지를 찾을 수 없습니다. <button className="btn link" onClick={() => navigate('/')}>홈으로</button></div>
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div
            className="logo"
            role="button"
            aria-label="홈으로"
            title="홈으로"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />
          <div>
            <div className="title">Welfare Navigator · DSA Engine</div>
            <div className="subtitle">해시 라우팅으로 플로우를 구성했습니다</div>
          </div>
        </div>
        <div className="row" />
      </header>

      {renderRoute()}

      <div className="footer-note">
        본 데모는 단순화된 로직과 임의 기준을 사용합니다. 실제 자격 확인은 관련 기관 고지와 상담을 통해 진행되어야 합니다.
      </div>

      {/* 상시 플로팅 홈 버튼 */}
      <HomeButton navigate={navigate} />
    </div>
  )
}
