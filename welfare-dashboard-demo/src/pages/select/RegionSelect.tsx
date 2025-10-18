import KoreaMap from '@/components/KoreaMap'

export default function RegionSelect({ navigate }: { navigate: (p: string) => void }) {
  const onSelect = (r: string) => {
    try {
      const cur = JSON.parse(localStorage.getItem('profileSelections') || '{}')
      cur.region = r
      localStorage.setItem('profileSelections', JSON.stringify(cur))
    } catch {}
    navigate('/profile')
  }

  const selected = (() => {
    try { return JSON.parse(localStorage.getItem('profileSelections') || '{}')?.region } catch { return undefined }
  })()

  return (
    <div className="panel">
      <div className="section-title">지역 선택 · 도 단위</div>
      <KoreaMap onSelect={onSelect} selected={selected} />
      <div className="muted" style={{ marginTop: 8 }}>도형을 클릭해 도/광역시를 선택하세요. 선택 시 나의정보선택으로 돌아갑니다.</div>
    </div>
  )
}
