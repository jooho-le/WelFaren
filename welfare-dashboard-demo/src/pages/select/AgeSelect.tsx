import { saveProfile } from '@/api/user'

export default function AgeSelect({ navigate }: { navigate: (p: string) => void }) {
  const setAge = (a: string) => {
    try {
      const cur = JSON.parse(localStorage.getItem('profileSelections') || '{}')
      cur.age = a
      localStorage.setItem('profileSelections', JSON.stringify(cur))
    } catch {}
    const ageVal = a === '청년' ? 29 : a === '중장년' ? 45 : a === '시니어' ? 68 : undefined
    if (ageVal) saveProfile({ age: ageVal }).catch(()=>{})
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
