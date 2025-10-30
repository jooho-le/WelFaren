export type RecommendationItem = {
  id: string
  name: string
  provider?: string
  categories?: string[]
  summary?: string
  url?: string
  score?: number
}

export type RecommendPayload = {
  region_code?: string | null
  job_category?: string | null
  age?: number | null
  preferences?: string[]
  household_size?: number | null
  recognized_income?: number | null
}

const REGION_CODE_MAP: Record<string, string> = {
  '서울': '11',
  '부산': '26',
  '대구': '27',
  '인천': '28',
  '광주': '29',
  '대전': '30',
  '울산': '31',
  '세종': '36',
  '경기': '41',
  '강원': '51',
  '충북': '43',
  '충남': '44',
  '전북': '45',
  '전남': '46',
  '경북': '47',
  '경남': '48',
  '제주': '50',
}

function mapProfileToPayload(profile: any): RecommendPayload {
  const regionName: string | undefined = profile?.region
  const jobRaw: string | undefined = profile?.job
  const ageGroup: string | undefined = profile?.age
  const prefRaw: string | undefined = profile?.pref

  // map region to code
  const region_code = regionName ? (REGION_CODE_MAP[regionName] || null) : null

  // normalize job
  let job_category: string | null = null
  if (jobRaw) {
    if (jobRaw === '근로자') job_category = '직장인'
    else job_category = jobRaw
  }

  // age group → approximate age
  let age: number | null = null
  if (ageGroup === '청년') age = 29
  else if (ageGroup === '중장년') age = 45
  else if (ageGroup === '시니어') age = 68

  // preferences → categories
  let preferences: string[] = []
  if (prefRaw === '복지 우선') preferences = ['주거', '의료', '생계']
  else if (prefRaw === '금융 우선') preferences = ['저소득', '생계']
  else if (prefRaw === '둘 다') preferences = ['주거', '의료', '교육', '생계']

  return { region_code, job_category, age, preferences }
}

export async function fetchRecommendations(): Promise<RecommendationItem[]> {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  let profile: any = {}
  try { profile = JSON.parse(localStorage.getItem('profileSelections') || '{}') } catch {}
  const payload = mapProfileToPayload(profile)

  const res = await fetch(`${base}/welfare/recommendations`, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const data = await res.json()
  return (data?.items || []) as RecommendationItem[]
}

export type RecommendResponseMeta = {
  used_mock: boolean
  api_base: string
  list_path: string
  filters: RecommendPayload
}

export async function fetchRecommendationsWithMeta(): Promise<{ items: RecommendationItem[]; meta: RecommendResponseMeta | null }>{
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  let profile: any = {}
  try { profile = JSON.parse(localStorage.getItem('profileSelections') || '{}') } catch {}
  const payload = mapProfileToPayload(profile)

  const res = await fetch(`${base}/welfare/recommendations`, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const data = await res.json()
  return { items: (data?.items || []) as RecommendationItem[], meta: (data?.meta || null) as RecommendResponseMeta | null }
}

export type DiagnoseResult = { recognized_income: number; ratio: number; grade: string; standard: number; effective_date: string }

export async function diagnoseIncome(params: { household_size: number; monthly_income: number; total_assets: number }): Promise<DiagnoseResult> {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const res = await fetch(`${base}/welfare/diagnose`, {
    method: 'POST', headers: withAuth({ 'Content-Type': 'application/json' }), body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const data = await res.json()
  return data?.result as DiagnoseResult
}

function withAuth(h: Record<string, string>) {
  try {
    const tok = localStorage.getItem('authToken')
    if (tok) return { ...h, Authorization: `Bearer ${tok}` }
  } catch {}
  return h
}
