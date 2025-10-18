export default function WelfareHub({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">복지 허브</div>
      <div className="grid cols-3">
        <button className="btn" onClick={() => navigate('/welfare/주거')}>주거</button>
        <button className="btn" onClick={() => navigate('/welfare/일자리')}>일자리</button>
        <button className="btn" onClick={() => navigate('/welfare/인권')}>인권</button>
        <button className="btn" onClick={() => navigate('/welfare/평생교육')}>평생교육</button>
      </div>
      <div className="spacer" />
      <div className="row">
        <button className="btn secondary" onClick={() => navigate('/wizard/1')}>내 자격 계산 열기</button>
        <button className="btn secondary" onClick={() => navigate('/')}>홈</button>
      </div>
    </div>
  )
}

