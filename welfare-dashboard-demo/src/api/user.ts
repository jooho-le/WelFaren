import { getToken } from './auth'

const API_BASE = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export type Profile = { region_code?: string | null; job_category?: string | null; age?: number | null; preferences?: string[] }

function authHeaders(): Record<string, string> {
  const tok = getToken()
  if (!tok) return {}
  return { Authorization: `Bearer ${tok}` }
}

export async function saveProfile(p: Profile) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
  }

  const res = await fetch(`${API_BASE()}/user/profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify(p),
  })
  if (!res.ok) throw new Error(await res.text())
}

