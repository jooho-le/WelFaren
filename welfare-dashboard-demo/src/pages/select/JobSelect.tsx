export default function JobSelect({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">직업 선택</div>
      <div className="grid cols-3">
        {['학생','근로자','자영업','구직자','프리랜서','기타'].map(j => (
          <button key={j} className="btn secondary" onClick={() => navigate('/select/age')}>{j}</button>
        ))}
      </div>
    </div>
  )
}

