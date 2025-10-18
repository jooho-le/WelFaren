export default function PrefSelect({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">선호도 선택</div>
      <div className="grid cols-3">
        {['복지 우선','금융 우선','둘 다'].map(p => (
          <button key={p} className="btn" onClick={() => navigate(p === '금융 우선' ? '/hub/finance' : '/hub/welfare')}>{p}</button>
        ))}
      </div>
    </div>
  )
}

