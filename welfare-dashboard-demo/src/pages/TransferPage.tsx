import { useEffect, useState } from 'react'

type Recipient = { name: string; bank: string; account: string }

export default function TransferPage({ navigate }: { navigate: (p: string) => void }) {
  const [name, setName] = useState('')
  const [bank, setBank] = useState('국민')
  const [account, setAccount] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [memo, setMemo] = useState('')
  const [favorites, setFavorites] = useState<Recipient[]>(() => {
    try { return JSON.parse(localStorage.getItem('favRecipients') || '[]') } catch { return [] }
  })
  const [recents, setRecents] = useState<Array<Recipient & { amount: number; time: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('recentTransfers') || '[]') } catch { return [] }
  })

  const canSend = name && bank && account && Number(amount) > 0
  const fee = Number(amount) >= 500000 ? 500 : 0

  useEffect(() => { localStorage.setItem('favRecipients', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('recentTransfers', JSON.stringify(recents.slice(0, 5))) }, [recents])

  const fill = (r: Recipient) => { setName(r.name); setBank(r.bank); setAccount(r.account) }
  const addFav = () => {
    if (!name || !account) return
    const exists = favorites.some(f => f.name === name && f.account === account)
    if (!exists) setFavorites([{ name, bank, account }, ...favorites].slice(0, 8))
  }
  const send = () => {
    alert('데모 전송: 실제 이체는 수행하지 않습니다.')
    if (!canSend) return
    setRecents([{ name, bank, account, amount: Number(amount), time: Date.now() }, ...recents].slice(0, 5))
  }

  return (
    <div className="panel">
      <div className="section-title">간편송금</div>

      <div className="grid cols-2">
        <div>
          <label>받는 분 성명</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="예: 홍길동" />
        </div>
        <div>
          <label>은행</label>
          <select className="input" value={bank} onChange={e => setBank(e.target.value)}>
            {['국민','신한','우리','하나','농협','기업','카카오뱅크','토스뱅크'].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label>계좌번호</label>
          <input className="input" value={account} onChange={e => setAccount(e.target.value)} placeholder="예: 123456-78-901234" />
        </div>
        <div>
          <label>송금 금액(원)</label>
          <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')} placeholder="예: 50000" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label>메모(선택)</label>
          <input className="input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 점심값" />
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <span className="badge info">예상 수수료 {fee.toLocaleString()}원</span>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" disabled={!canSend} onClick={send}>송금하기</button>
        <button className="btn secondary" onClick={() => navigate('/')}>홈으로</button>
        <button className="btn secondary" onClick={addFav}>즐겨찾기 추가</button>
      </div>

      <div className="spacer" />

      <div className="card">
        <div className="section-title">즐겨찾기</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {favorites.length === 0 && <span className="muted">등록된 즐겨찾기가 없습니다.</span>}
          {favorites.map((f, i) => (
            <button key={i} className="chip" onClick={() => fill(f)}>
              {f.name} · {f.bank} · {f.account}
            </button>
          ))}
        </div>
      </div>

      <div className="spacer" />

      <div className="card">
        <div className="section-title">최근 이체</div>
        {recents.length === 0 && <div className="muted">최근 이체 내역이 없습니다.</div>}
        {recents.map((r, i) => (
          <div key={i} className="row" style={{ justifyContent: 'space-between' }}>
            <div>{r.name} · {r.bank} · {r.account}</div>
            <div style={{ fontWeight: 800 }}>{r.amount.toLocaleString()}원</div>
          </div>
        ))}
      </div>
    </div>
  )
}
