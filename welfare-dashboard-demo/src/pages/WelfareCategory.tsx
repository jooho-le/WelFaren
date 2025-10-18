export default function WelfareCategory({ navigate, name }: { navigate: (p: string) => void, name: string }) {
  return (
    <div className="panel">
      <div className="section-title">복지 카테고리 · {name}</div>
      <div className="muted">데모: {name} 관련 제도 리스트/카드가 이곳에 표시됩니다.</div>
      <div className="spacer" />
      <div className="row">
        <button className="btn" onClick={() => navigate('/hub/welfare')}>복지 허브</button>
        <button className="btn secondary" onClick={() => navigate('/wizard/1')}>자격 계산 열기</button>
      </div>
    </div>
  )
}

