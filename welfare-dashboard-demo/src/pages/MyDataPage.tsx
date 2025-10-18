export default function MyDataPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">마이데이터</div>
      <div className="muted">데모: 금융계정/공공데이터 연동 버튼을 배치하세요.</div>
      <div className="spacer" />
      <div className="row">
        <button className="btn" onClick={() => navigate('/profile')}>나의정보선택</button>
        <button className="btn secondary" onClick={() => navigate('/')}>홈</button>
      </div>
    </div>
  )
}

