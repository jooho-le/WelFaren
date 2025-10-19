export default function MyDataPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel" style={{ textAlign: 'center' }}>
      <div className="section-title" style={{ fontSize: 40 }}>현재 나의 금융상품 및 자산보기</div>
      <div className="spacer" />
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
        <button className="btn" onClick={() => navigate('/mydata/finance')}>금융상품</button>
        <button className="btn secondary" onClick={() => navigate('/mydata/assets')}>자산</button>
        <button className="btn alert" onClick={() => navigate('/mydata/welfare')}>복지</button>
      </div>
    </div>
  )
}
