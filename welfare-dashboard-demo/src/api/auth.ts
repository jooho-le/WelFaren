export type AuthTokens = { access_token: string; token_type: string }

const API_BASE = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function register(user_id: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE()}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id, password })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function login(user_id: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE()}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id, password })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function saveToken(tok: string) { localStorage.setItem('authToken', tok) }
export function getToken(): string | null { return localStorage.getItem('authToken') }
export function clearToken() { localStorage.removeItem('authToken') }
export function saveUserId(id: string) { localStorage.setItem('userId', id) }
export function getUserId(): string | null { return localStorage.getItem('userId') }
export function clearUserId() { localStorage.removeItem('userId') }
