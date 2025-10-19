import React, { useMemo } from 'react'
import { Capacitor } from '@capacitor/core'
import logoImg from '@/assets/logo.png'
import aibbImg from '@/assets/aibb.png'
import type { AssetFormData } from '@/components/AssetInput'

export default function HomeLanding({ navigate, data }: { navigate: (p: string) => void, data: AssetFormData }) {
  const isNative = (Capacitor as any)?.getPlatform ? (Capacitor as any).getPlatform() !== 'web' : (Capacitor.isNativePlatform?.() || false)
  const now = new Date()
  const maturity = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + Math.max(0, data.savings.monthsRemaining || 0))
    return d
  }, [data])
  const dday = Math.max(0, Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const expected = Math.round(data.savings.principal * (1 + data.savings.annualRate * (Math.max(0, data.savings.monthsRemaining) / 12)))
  const daysRemaining = Math.max(1, Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const interest = Math.max(0, expected - data.savings.principal)
  const tax = Math.round(interest * 0.154) // 예시: 15.4%
  const dailyNeed = Math.round(expected / daysRemaining)

  const fmt = (n: number) => n.toLocaleString()
  const fmtDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  const consentThen = (next: () => void) => {
    const ok = localStorage.getItem('consent-ok') === '1' || confirm('개인정보 이용에 동의하시겠습니까?')
    if (ok) { localStorage.setItem('consent-ok', '1'); next() }
  }
  const playQuiz = () => {
    alert('광고 시청 후 퀴즈 시작 (데모)')
    const reward = Math.floor(Math.random() * 1_000_000) + 1
    alert(`정답! ${reward.toLocaleString()}원이 적립됩니다. (데모)`)
  }
  const playLotto = () => {
    alert('광고 시청 후 복권 발급 (데모)')
    const ticket = Math.floor(100000 + Math.random() * 900000)
    alert(`복권 번호: ${ticket} (매주 자동 추첨)`) 
  }

  if (isNative) {
    return (
      <div className="mobile-home">
        {/* 상단 브랜드/알림 */}
        <div className="mh-header">
          <img src={logoImg} className="brand-logo" alt="WELFAREN" />
          <button className="icon-btn" onClick={() => navigate('/profile')} aria-label="알림">🔔</button>
        </div>

        {/* 검색/AI (삐삐) */}
        <div className="mh-search">
          <img src={aibbImg} className="ai-avatar-img" alt="삐삐" />
          <button className="search-pill" onClick={() => navigate('/consult')}>삐삐한테 물어보기</button>
          <button className="icon-btn" aria-label="검색">🔍</button>
        </div>

        {/* 핵심 지표 */}
        <div className="mh-metrics">
          <div className="mh-card">
            <div className="mh-dday">D-{dday}</div>
            <div className="mh-label">현재 적금 금액</div>
            <div className="mh-value">{fmt(data.savings.principal)}원</div>
          </div>
          <div className="mh-card">
            <div className="mh-label">미래 적금 금액(예상)</div>
            <div className="mh-value">{fmt(expected)}원</div>
            <div className="mh-sub">예상 만기일 {fmtDate(maturity)}</div>
            <div className="row" style={{ marginTop: 6 }}>
              <button className="btn secondary" onClick={() => navigate('/transfer')}>간편 송금하기</button>
            </div>
          </div>
        </div>

        {/* 좌/중앙/우 스탯 */}
        <div className="stat-grid">
          <div className="stat-mini">
            <div className="sm-title">현재 총 적금</div>
            <div className="sm-value">{fmt(data.savings.principal)}원</div>
          </div>
          <div className="center-stat">
            <div className="cs-dday">D-{dday}</div>
            <div className="cs-date">{fmtDate(maturity)}</div>
          </div>
          <div className="stat-mini">
            <div className="sm-title">세전</div>
            <div className="sm-value">{fmt(expected)}원</div>
            <div className="sm-title">예상 세금 {fmt(tax)}원</div>
          </div>
        </div>

        {/* 목표 */}
        <div className="goal-row">
          <div className="goal-label">목표 금액</div>
          <div className="goal-value">100,000,000</div>
          <div className="goal-sub">예상 달성일 {fmtDate(maturity)}</div>
          <div>
            <button className="h-link" onClick={() => navigate('/consult')}>단축하는 방법 보기</button>
          </div>
        </div>

        {/* 오늘의 */}
        <div className="action-3">
          <button className="action-btn" onClick={() => consentThen(() => navigate('/search'))}>오늘의 세금</button>
          <button className="action-btn" onClick={() => consentThen(() => navigate('/wizard/1'))}>오늘의 복지</button>
          <button className="action-btn" onClick={() => consentThen(() => navigate('/wizard/2'))}>오늘의 적금</button>
        </div>

        {/* 퀵 CTA */}
        <div className="quiz-row">
          <button className="quiz-btn" onClick={playQuiz}>3초 금융 상식 퀴즈</button>
          <button className="quiz-btn" onClick={playLotto}>3초 복권</button>
        </div>

        {/* 광고 박스 (추후 대체) */}
        <div className="ad-card">
          <div className="ad-thumb" />
          <div className="ad-copy">아무 의미 없습니다!</div>
        </div>

        {/* 하단 탭바 */}
        <div className="subnav fixed">
          <button className="nav-btn nav-btn-sm black" onClick={() => navigate('/')}>홈</button>
          <button className="nav-btn nav-btn-sm black" onClick={() => navigate('/transfer')}>간편송금</button>
          <button className="nav-btn nav-btn-sm black" onClick={() => navigate('/savings')}>내 가족 적금</button>
          <button className="nav-btn nav-btn-sm black" onClick={() => navigate('/mydata')}>마이데이터</button>
          <button className="nav-btn nav-btn-sm black" onClick={() => navigate('/search')}>전체</button>
        </div>
      </div>
    )
  }

  // Web landing (fixed to reference design): marketing hero + sections
  return (
    <div className="home-full">
      <section className="fullbleed marketing-hero">
        <div className="marketing-inner">
          <h1 className="hero-title">
            금융-복지의 연결
            <br />
            웰페린에서 쉽고 간편하게
          </h1>
          <div className="store-buttons" aria-label="앱 다운로드 경로">
            <a className="store-btn" href="#" onClick={(e) => e.preventDefault()} aria-label="App Store로 이동 예정"><span className="store-ico"></span>App Store</a>
            <a className="store-btn" href="#" onClick={(e) => e.preventDefault()} aria-label="Google Play로 이동 예정"><span className="store-ico">▶</span>Google Play</a>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-inner">
          <h2 className="section-head">왜 웰페린인가</h2>
          <p className="lead">복지와 금융을 한 곳에서. 필요한 정보만 빠르게 찾아주고, 맞춤 추천으로 더 나은 선택을 돕습니다.</p>
          <div className="feature-grid">
            <div className="feature"><div className="feature-emoji" aria-hidden>🤖</div><div className="feature-title">AI 상담</div><div className="feature-desc">일상어로 질문하고 즉시 답변을 받아보세요.</div></div>
            <div className="feature"><div className="feature-emoji" aria-hidden>🏦</div><div className="feature-title">복지·적금 추천</div><div className="feature-desc">상황에 맞는 추천을 깔끔하게.</div></div>
            <div className="feature"><div className="feature-emoji" aria-hidden>📊</div><div className="feature-title">내 자산 한눈에</div><div className="feature-desc">마이데이터 연동으로 정확하게.</div></div>
            <div className="feature"><div className="feature-emoji" aria-hidden>⚡</div><div className="feature-title">간편한 시작</div><div className="feature-desc">기본 정보만으로 바로 사용.</div></div>
          </div>
        </div>
      </section>

      <section className="home-section alt">
        <div className="section-inner">
          <h2 className="section-head">주요 기능</h2>
          <div className="highlight-grid">
            <div className="highlight"><div className="h-title">현재 적금 금액</div><div className="h-desc">보유 적금 총액과 만기 예상금액 확인</div><button className="h-link" onClick={() => navigate('/savings')}>바로 보기</button></div>
            <div className="highlight"><div className="h-title">마이데이터 연동</div><div className="h-desc">금융상품·자산 연결로 더 정확한 추천</div><button className="h-link" onClick={() => navigate('/mydata')}>연동 관리</button></div>
            <div className="highlight"><div className="h-title">나의 정보 선택</div><div className="h-desc">지역·직업·연령 등 프로필 선택</div><button className="h-link" onClick={() => navigate('/profile')}>설정하기</button></div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-inner">
          <h2 className="section-head">안전하고 투명하게</h2>
          <div className="trust-row">
            <span className="trust-pill">개인정보 최소 수집</span>
            <span className="trust-pill">목적 외 사용 금지</span>
            <span className="trust-pill">요청 시 즉시 삭제</span>
          </div>
        </div>
      </section>

      <section className="home-section cta">
        <div className="section-inner cta-inner">
          <div>
            <div className="cta-title">지금 웰페린을 시작해 보세요</div>
            <div className="cta-desc">복잡한 정보 탐색은 그만. 필요한 것만 쉽게.</div>
          </div>
          <div className="store-buttons">
            <a className="store-btn" href="#" onClick={(e) => e.preventDefault()} aria-label="App Store로 이동 예정"><span className="store-ico"></span>App Store</a>
            <a className="store-btn" href="#" onClick={(e) => e.preventDefault()} aria-label="Google Play로 이동 예정"><span className="store-ico">▶</span>Google Play</a>
          </div>
        </div>
      </section>
    </div>
  )
}
