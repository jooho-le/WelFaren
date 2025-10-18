export default function TransferPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">간편송금</div>
      <div className="muted">데모: 간편송금 UI는 추후 구현. 여기서 계좌 선택 및 송금 흐름으로 확장하세요.</div>
      <div className="spacer" />
      <div className="row">
        <button className="btn" onClick={() => navigate('/')}>홈으로</button>
        <button className="btn secondary" onClick={() => navigate('/hub/finance')}>금융 허브</button>
      </div>
    </div>
  )
}

