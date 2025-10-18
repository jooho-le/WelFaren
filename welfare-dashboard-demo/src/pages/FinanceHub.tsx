export default function FinanceHub({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">금융 허브</div>
      <div className="grid cols-3">
        <button className="btn" onClick={() => navigate('/wizard/2')}>예적금</button>
        <button className="btn secondary" onClick={() => navigate('/finance/투자')}>투자</button>
      </div>
      <div className="spacer" />
      <div className="row">
        <button className="btn secondary" onClick={() => navigate('/')}>홈</button>
      </div>
    </div>
  )
}

