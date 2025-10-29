import type { AssetFormData } from '@/components/AssetInput'

export type SavingCurrent = {
  product_name: string
  annual_rate: number
  months_remaining: number
  principal: number
  expected_interest: number
  expected_interest_same_term?: number
  penalty_rate: number
  penalty_amount: number
  target_term?: number
}

export type SavingRecommendation = {
  product_name: string
  company_name?: string | null
  fin_prdt_cd?: string | null
  rate?: number | null
  base_rate?: number | null
  interest?: number | null
  interest_gain?: number | null
  monthly_gain?: number | null
  penalty?: number | null
  net_gain?: number | null
  rate_gain?: number | null
  save_term?: number | null
  description?: string | null
  join_method?: string | null
  join_member?: string | null
  max_limit?: number | null
  match_score?: number | null
  reasons?: string[]
  action?: string | null
}

export type SavingSwitchResponse = {
  current: SavingCurrent
  best?: SavingRecommendation | null
  alternatives: SavingRecommendation[]
  summary: {
    recommendation_count: number
    decision: string
    net_gain: number
    penalty_amount: number
    current_interest_projection: number
    current_interest_remaining: number
    confidence: number
    target_term?: number
  }
}

export type FinanceSwitchResponse = {
  saving?: SavingSwitchResponse | null
}

const API_BASE = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function fetchFinanceRecommendations(payload: AssetFormData, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE()}/finance/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || '추천 정보를 불러오지 못했습니다.')
  }
  return res.json() as Promise<FinanceSwitchResponse>
}
