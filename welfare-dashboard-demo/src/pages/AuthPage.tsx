import { useState } from 'react'
import { login, register, saveToken, saveUserId } from '@/api/auth'

export default function AuthPage({ navigate }: { navigate: (p: string) => void }) {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      const r = mode === 'login' ? await login(userId, password) : await register(userId, password)
      saveToken(r.access_token)
      saveUserId(userId)
      // notify app to update auth state and reset demo data
      window.dispatchEvent(new Event('authed'))
      navigate('/mydata')
    } catch (e: any) {
      setError(e?.message || '요청 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="section-title">{mode === 'login' ? '로그인' : '회원가입'}</div>
      <div className="grid cols-1">
        <input placeholder={mode === 'login' ? '아이디' : '아이디(필수)'} value={userId} onChange={e => setUserId(e.target.value)} />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="muted" style={{ color: 'crimson' }}>{error}</div>}
        <button className="btn" onClick={submit} disabled={loading}>{loading ? '처리 중…' : (mode === 'login' ? '로그인' : '가입하기')}</button>
        <button className="btn secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? '아직 계정이 없어요' : '이미 계정이 있어요'}
        </button>
      </div>
    </div>
  )
}
