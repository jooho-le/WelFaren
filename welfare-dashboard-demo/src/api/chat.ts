import { getToken } from './auth'

const API_BASE = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessagePayload {
  role: ChatRole
  content: string
}

export interface ChatContextPayload {
  step?: number
  assets?: {
    monthlyIncome?: number
    householdSize?: number
    realEstate?: number
    deposits?: number
    otherAssets?: number
    savings?: {
      productName?: string
      principal?: number
      annualRate?: number
      monthsRemaining?: number
      earlyTerminatePenaltyRate?: number
    }
  }
  incomeRecognition?: {
    total?: number
    perCapita?: number
  }
  eligibility?: {
    baseEligible?: boolean
    microFinanceEligible?: boolean
  }
}

export interface ChatRequestPayload {
  messages: ChatMessagePayload[]
  context?: ChatContextPayload
}

export interface ChatResponsePayload {
  reply: string
}

export async function requestChatReply(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const token = getToken()
  const res = await fetch(`${API_BASE()}/chat/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || '챗봇 응답을 받지 못했습니다.')
  }

  return res.json()
}
