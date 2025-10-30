import KoreaMap from '@/components/KoreaMap'
import { saveProfile } from '@/api/user'

export default function RegionSelect({ navigate }: { navigate: (p: string) => void }) {
  const onSelect = (r: string) => {
    try {
      const cur = JSON.parse(localStorage.getItem('profileSelections') || '{}')
      cur.region = r
      localStorage.setItem('profileSelections', JSON.stringify(cur))
    } catch {}
    // 서버 동기화 (로그인 상태일 때만 성공)
    const REGION_CODE_MAP: Record<string, string> = { '서울': '11','부산': '26','대구': '27','인천': '28','광주': '29','대전': '30','울산': '31','세종': '36','경기': '41','강원': '51','충북': '43','충남': '44','전북': '45','전남': '46','경북': '47','경남': '48','제주': '50' }
    const code = REGION_CODE_MAP[r] || undefined
    if (code) saveProfile({ region_code: code }).catch(()=>{})
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
