import { type FormEventHandler, type ReactNode, useMemo, useState } from 'react'
import { IconChat, IconCompass, IconData, IconSend } from '@/components/icons'

type Shortcut = {
  label: string
  to: string
  icon?: ReactNode
  description?: string
}

const fallbackShortcuts: Shortcut[] = [
  { label: '마이데이터', icon: <IconData size={22} />, description: '내 금융상품·자산 보기', to: '/mydata' },
  { label: 'AI 상담', icon: <IconChat size={22} />, description: '복지·금융 질문 바로하기', to: '/consult' },
  { label: '간편송금', icon: <IconSend size={22} />, description: '필요한 곳으로 빠르게 이체', to: '/transfer' },
  { label: '나의 정보 선택', icon: <IconCompass size={22} />, description: '지역·직업 등 프로필 설정', to: '/profile' }
]
export default function SearchPage({
  navigate,
  isNative = false,
  shortcuts = fallbackShortcuts
}: {
  navigate: (p: string) => void
  isNative?: boolean
  shortcuts?: Shortcut[]
}) {
  const items = shortcuts.filter((item) => item.to !== '/search')
  const [query, setQuery] = useState('')
  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return items
    return items.filter(({ label, description }) => {
      const target = `${label ?? ''} ${(description ?? '')}`.toLowerCase()
      return target.includes(term)
    })
  }, [items, query])
  const gridClass = `mh-search-shortcuts${isNative ? '' : ' mh-search-shortcuts--web'}`
  const cardClass = `mh-search-card${isNative ? '' : ' mh-search-card--web'}`
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const first = visibleItems[0] ?? items[0]
    if (first) navigate(first.to)
  }

  if (isNative) {
    return (
      <div className="mh-search-page">
        <form className="panel mh-search-field mh-search-form" onSubmit={handleSubmit}>
          <div>
            <div className="section-title">마이 페이지 검색</div>
            <p className="mh-search-hint">찾고 싶은 서비스를 입력하고 검색 버튼을 눌러보세요.</p>
          </div>
          <div className="mh-search-inputs">
            <input
              className="input"
              placeholder="예: 지원금, 예적금, 대출..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="btn mh-search-button">검색</button>
          </div>
        </form>
        <section className="mh-search-section" aria-label="이용 가능한 기능">
          <div className="mh-search-heading">바로가기</div>
          <div className={gridClass}>
            {visibleItems.map(({ label, icon, description, to }) => (
              <button
                key={label}
                type="button"
                className={cardClass}
                onClick={() => navigate(to)}
              >
                {icon && <span className="mh-search-icon" aria-hidden>{icon}</span>}
                <span className="mh-search-label">{label}</span>
                {description && <span className="mh-search-desc">{description}</span>}
              </button>
            ))}
          </div>
          {!visibleItems.length && (
            <div className="mh-search-empty">검색 결과가 없습니다.</div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="section-title">마이 페이지 검색</div>
      <form className="mh-search-form" onSubmit={handleSubmit}>
        <div className="mh-search-inputs">
          <input
            className="input"
            placeholder="예: 지원금, 예적금, 대출..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn mh-search-button">검색</button>
        </div>
      </form>
      <div className="spacer" />
      <div className={gridClass}>
        {visibleItems.map(({ label, icon, description, to }) => (
          <button
            key={label}
            type="button"
            className={cardClass}
            onClick={() => navigate(to)}
          >
            {icon && <span className="mh-search-icon" aria-hidden>{icon}</span>}
            <span className="mh-search-label">{label}</span>
            {description && <span className="mh-search-desc">{description}</span>}
          </button>
        ))}
      </div>
      {!visibleItems.length && (
        <>
          <div className="spacer" />
          <div className="mh-search-empty">검색 결과가 없습니다.</div>
        </>
      )}
      <div className="spacer" />
      <div className="row">
        <button className="btn" onClick={() => navigate('/consult')}>AI 상담 연결</button>
        <button className="btn secondary" onClick={() => navigate('/')}>홈</button>
      </div>
    </div>
  )
}
