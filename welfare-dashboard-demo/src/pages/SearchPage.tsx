export default function SearchPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">마이 페이지 검색</div>
      <input className="input" placeholder="예: 지원금, 예적금, 대출..." />
      <div className="spacer" />
      <div className="row">
        <button className="btn" onClick={() => navigate('/consult')}>AI 상담 연결</button>
        <button className="btn secondary" onClick={() => navigate('/')}>홈</button>
      </div>
    </div>
  )
}

