export default function RegionSelect({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">지역 선택</div>
      <div className="grid cols-3">
        {['서울','경기','부산','대구','인천','광주'].map(r => (
          <button key={r} className="btn secondary" onClick={() => navigate('/select/job')}>{r}</button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={() => navigate('/hub/welfare')}>복지 허브로</button>
      </div>
    </div>
  )
}

