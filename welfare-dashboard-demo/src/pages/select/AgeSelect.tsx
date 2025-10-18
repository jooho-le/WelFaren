export default function AgeSelect({ navigate }: { navigate: (p: string) => void }) {
  const setAge = (a: string) => {
    try {
      const cur = JSON.parse(localStorage.getItem('profileSelections') || '{}')
      cur.age = a
      localStorage.setItem('profileSelections', JSON.stringify(cur))
    } catch {}
    navigate('/profile')
  }

  return (
    <div className="panel">
      <div className="section-title">나이 선택</div>
      <div className="grid cols-3">
        {['청년','중장년','시니어'].map(a => (
          <button key={a} className="btn secondary" onClick={() => setAge(a)}>{a}</button>
        ))}
      </div>
    </div>
  )
}
