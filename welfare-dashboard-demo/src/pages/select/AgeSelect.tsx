export default function AgeSelect({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">나이 선택</div>
      <div className="grid cols-3">
        {['청년','중장년','시니어'].map(a => (
          <button key={a} className="btn secondary" onClick={() => navigate('/select/pref')}>{a}</button>
        ))}
      </div>
    </div>
  )
}

