import { saveProfile } from '@/api/user'

export default function PrefSelect({ navigate }: { navigate: (p: string) => void }) {
  const setPref = (p: string) => {
    try {
      const cur = JSON.parse(localStorage.getItem('profileSelections') || '{}')
      cur.pref = p
      localStorage.setItem('profileSelections', JSON.stringify(cur))
    } catch {}
    const prefs = p === '복지 우선' ? ['주거','의료','생계'] : p === '금융 우선' ? ['저소득','생계'] : ['주거','의료','교육','생계']
    saveProfile({ preferences: prefs }).catch(()=>{})
    navigate('/profile')
  }

  return (
    <div className="panel">
      <div className="section-title">선호도 선택</div>
      <div className="grid cols-3">
        {['복지 우선','금융 우선','둘 다'].map(p => (
          <button key={p} className="btn" onClick={() => setPref(p)}>{p}</button>
        ))}
      </div>
    </div>
  )
}
