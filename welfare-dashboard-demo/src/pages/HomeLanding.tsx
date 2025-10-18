import React from 'react'

export default function HomeLanding({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="home-full">
      {/* Marketing style hero */}
      <section className="fullbleed marketing-hero">
        <div className="marketing-inner">
          <h1 className="hero-title">
            금융-복지의 연결 
            <br />
            웰페린에서 쉽고 간편하게
          </h1>

          <div className="store-buttons" aria-label="앱 다운로드 경로">
            <a className="store-btn" href="#" onClick={(e) => e.preventDefault()} aria-label="App Store로 이동 예정">
              <span className="store-ico"></span>
              App Store
            </a>
            <a className="store-btn" href="#" onClick={(e) => e.preventDefault()} aria-label="Google Play로 이동 예정">
              <span className="store-ico">▶</span>
              Google Play
            </a>
          </div>

          {/* 일러스트 타일 제거 요청에 따라 삭제 */}
        </div>
      </section>

      {/* 소개 섹션 */}
      <section className="home-section">
        <div className="section-inner">
          <h2 className="section-head">왜 웰페린인가</h2>
          <p className="lead">복지와 금융을 한 곳에서. 필요한 정보만 빠르게 찾아주고, 맞춤 추천으로 더 나은 선택을 돕습니다.</p>

          <div className="feature-grid">
            <div className="feature">
              <div className="feature-emoji" aria-hidden>🤖</div>
              <div className="feature-title">AI 상담</div>
              <div className="feature-desc">일상어로 질문하고 즉시 답변을 받아보세요. 자산 입력부터 추천까지 대화로 진행해요.</div>
            </div>
            <div className="feature">
              <div className="feature-emoji" aria-hidden>🏦</div>
              <div className="feature-title">복지·적금 추천</div>
              <div className="feature-desc">상황에 맞는 복지와 금융상품을 비교·추천하여 최적의 선택을 도와드려요.</div>
            </div>
            <div className="feature">
              <div className="feature-emoji" aria-hidden>📊</div>
              <div className="feature-title">내 자산 한눈에</div>
              <div className="feature-desc">마이데이터로 금융상품과 자산을 연결하고, 변화 추이를 손쉽게 확인합니다.</div>
            </div>
            <div className="feature">
              <div className="feature-emoji" aria-hidden>⚡</div>
              <div className="feature-title">간편한 시작</div>
              <div className="feature-desc">복잡한 절차 없이 기본 정보만으로도 바로 사용 가능합니다.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 하이라이트 */}
      <section className="home-section alt">
        <div className="section-inner">
          <h2 className="section-head">주요 기능</h2>
          <div className="highlight-grid">
            <div className="highlight">
              <div className="h-title">현재 적금 금액</div>
              <div className="h-desc">보유 적금 총액, 만기 예상금액, 이자율을 한 화면에서 확인</div>
              <button className="h-link" onClick={() => navigate('/savings')}>바로 보기</button>
            </div>
            <div className="highlight">
              <div className="h-title">마이데이터 연동</div>
              <div className="h-desc">금융상품·자산 연결로 더 정확한 추천 제공</div>
              <button className="h-link" onClick={() => navigate('/mydata')}>연동 관리</button>
            </div>
            <div className="highlight">
              <div className="h-title">나의 정보 선택</div>
              <div className="h-desc">지역·직업·연령 등 프로필 선택으로 개인화 강화</div>
              <button className="h-link" onClick={() => navigate('/profile')}>설정하기</button>
            </div>
          </div>
        </div>
      </section>

      {/* 신뢰/보안 섹션 */}
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

      {/* CTA 배너 */}
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
