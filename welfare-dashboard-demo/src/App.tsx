import { useMemo, useState } from 'react'
import AssetInput, { AssetFormData } from './components/AssetInput'
import WelfareResults from './components/WelfareResults'
import DSAEngine from './components/DSAEngine'
import ChatBot from './components/ChatBot'

type Step = 0 | 1 | 2
type Mode = 'landing' | 'chat' | 'form'

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
  const [mode, setMode] = useState<Mode>('landing')
  const [step, setStep] = useState<Step>(0)
  const [data, setData] = useState<AssetFormData>(defaultData)

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

  // Landing mode: first visit selection
  if (mode === 'landing') {
    return (
      <div className="landing">
        <div className="container">
          <header className="header">
            <div className="brand">
              <div className="logo" />
              <div>
                <div className="title">Welfare Navigator · DSA Engine</div>
                <div className="subtitle">원하는 방식으로 시작하세요</div>
              </div>
            </div>
            <div className="muted">데모 · 로컬에서 실행 가능</div>
          </header>
        </div>

        <div className="landing-split" role="group" aria-label="시작 방법 선택">
          <button className="landing-option" onClick={() => setMode('chat')} aria-label="챗봇으로 상담하기">
            <div className="landing-emoji" aria-hidden="true">🤖</div>
            <div className="landing-title">챗봇으로 상담하기</div>
            <div className="landing-desc">대화형으로 소득/자산 입력과 추천을 진행합니다.</div>
            <div className="row" style={{ marginTop: 6 }}>
              <span className="btn" style={{ padding: '10px 14px' }}>시작</span>
            </div>
          </button>
          <button className="landing-option" onClick={() => setMode('form')} aria-label="입력형으로 진행하기">
            <div className="landing-emoji" aria-hidden="true">📝</div>
            <div className="landing-title">입력형으로 진행하기</div>
            <div className="landing-desc">폼으로 단계별 입력 후 결과를 확인합니다.</div>
            <div className="row" style={{ marginTop: 6 }}>
              <span className="btn secondary" style={{ padding: '10px 14px' }}>시작</span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Chat-only mode
  if (mode === 'chat') {
    return (
      <div className="container">
        <ChatBot
          data={data}
          setData={setData}
          step={step}
          setStep={setStep}
          incomeRecognition={incomeRecognition}
          eligibility={welfare}
          fullscreen
          onExit={() => setMode('landing')}
        />
      </div>
    )
  }

  // Form mode
  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="title">Welfare Navigator · DSA Engine</div>
            <div className="subtitle">소득인정액 계산과 금융 갈아타기 추천을 한 곳에서</div>
          </div>
        </div>
        <div className="muted">데모 · 로컬에서 실행 가능</div>
      </header>

      <div className="stepper">
        <div className={`step ${step === 0 ? 'active' : ''}`}>① 자산 입력</div>
        <div className={`step ${step === 1 ? 'active' : ''}`}>② 복지 추천 결과</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>③ 금융 갈아타기 추천</div>
      </div>

      {step === 0 && (
        <div className="panel">
          <AssetInput
            value={data}
            onChange={setData}
            onNext={() => setStep(1)}
          />
        </div>
      )}

      {step === 1 && (
        <div className="grid cols-2">
          <div className="panel">
            <WelfareResults
              data={data}
              incomeRecognition={incomeRecognition}
              eligibility={welfare}
            />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={() => setStep(0)}>이전</button>
              <button className="btn" onClick={() => setStep(2)}>다음 · DSA 추천</button>
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
          <DSAEngine data={data} onBack={() => setStep(1)} />
        </div>
      )}

      <div className="footer-note">
        본 데모는 단순화된 로직과 임의 기준을 사용합니다. 실제 자격 확인은 관련 기관 고지와 상담을 통해 진행되어야 합니다.
      </div>

      {/* 챗봇 오버레이는 입력형 모드에서는 숨김 */}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn link" onClick={() => setMode('landing')}>처음 화면으로</button>
      </div>
    </div>
  )
}
