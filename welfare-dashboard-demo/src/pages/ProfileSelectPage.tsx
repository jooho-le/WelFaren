import { useEffect, useState } from 'react'

export default function ProfileSelectPage({ navigate }: { navigate: (p: string) => void }) {
  const [selected, setSelected] = useState<{ region?: string; job?: string; age?: string; pref?: string }>({})
  useEffect(() => {
    try { setSelected(JSON.parse(localStorage.getItem('profileSelections') || '{}')) } catch { setSelected({}) }
  }, [])

  const reset = () => {
    localStorage.removeItem('profileSelections')
    setSelected({})
  }

  return (
    <div className="panel">
      <div className="section-title">나의정보선택</div>
      <div className="grid cols-2">
        <button className="btn" onClick={() => navigate('/select/region')}>지역 선택</button>
        <button className="btn" onClick={() => navigate('/select/job')}>직업 선택</button>
        <button className="btn" onClick={() => navigate('/select/age')}>나이 선택</button>
        <button className="btn" onClick={() => navigate('/select/pref')}>선호도 선택</button>
      </div>

      <div className="spacer" />
      <div className="card">
        <div className="section-title">선택한 정보</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {selected.region ? <span className="pill">지역: {selected.region}</span> : <span className="muted">지역 미선택</span>}
          {selected.job ? <span className="pill">직업: {selected.job}</span> : <span className="muted">직업 미선택</span>}
          {selected.age ? <span className="pill">나이: {selected.age}</span> : <span className="muted">나이 미선택</span>}
          {selected.pref ? <span className="pill">선호도: {selected.pref}</span> : <span className="muted">선호도 미선택</span>}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn secondary" onClick={reset}>초기화</button>
        </div>
      </div>
    </div>
  )
}
