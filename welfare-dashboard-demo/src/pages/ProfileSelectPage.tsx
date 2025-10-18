export default function ProfileSelectPage({ navigate }: { navigate: (p: string) => void }) {
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
      <div className="row">
        <button className="btn secondary" onClick={() => navigate('/hub/welfare')}>복지 허브로</button>
        <button className="btn secondary" onClick={() => navigate('/hub/finance')}>금융 허브로</button>
      </div>
    </div>
  )
}

