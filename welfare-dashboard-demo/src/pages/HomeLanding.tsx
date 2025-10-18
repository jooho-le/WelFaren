import React from 'react'

export default function HomeLanding({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="home-full">
      {/* 상단 로고만 노출 */}
      <section className="fullbleed hero">
        <div className="hero-inner">
          <div className="metric-head">
            <div className="brand-mini">
              <div className="logo" />
              <div style={{ fontWeight: 800 }}>웰페린</div>
            </div>
          </div>

          {/* 홈 버튼 7개만 노출 */}
          <div className="pill-row" style={{ marginTop: 18 }}>
            <button className="pill-btn" onClick={() => navigate('/consult')}>AI 챗봇상담</button>
            <button className="pill-btn" onClick={() => navigate('/transfer')}>간편송금</button>
            <button className="pill-btn" onClick={() => navigate('/wizard/0')}>현재 적금 금액</button>
            <button className="pill-btn pill-warm" onClick={() => navigate('/wizard/1')}>복지 조회하기</button>
            <button className="pill-btn pill-calm" onClick={() => navigate('/wizard/2')}>적금 조회하기</button>
            <button className="pill-btn" onClick={() => navigate('/mydata')}>마이데이터</button>
            <button className="pill-btn" onClick={() => navigate('/profile')}>나의 정보선택</button>
          </div>
        </div>
      </section>

      {/* 사용 설명 패널 */}
      <section className="cards">
        <div className="panel">
          <div className="section-title">사이트 사용 설명</div>
          <div className="muted" style={{ marginBottom: 10 }}>아래 가이드에 따라 빠르게 필요한 정보를 찾아보세요.</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            <li>🧭 복지 조회하기: 현재 상황을 바탕으로 받을 수 있는 복지를 탐색합니다.</li>
            <li>💰 적금 조회하기: 내 적금 상황을 분석하고 더 나은 상품을 추천받습니다.</li>
            <li>📊 현재 적금 금액: 입력한 자산/적금 정보를 확인하고 수정할 수 있습니다.</li>
            <li>🤖 AI 챗봇상담: 궁금한 점을 자연어로 물어보고 맞춤 안내를 받아보세요.</li>
            <li>🔁 간편송금: 자주 쓰는 계좌로 간편하게 송금합니다.</li>
            <li>📥 마이데이터: 금융/자산 정보를 연동해 더 정확한 분석을 합니다.</li>
            <li>👤 나의 정보선택: 연령/지역/직업 등 프로필을 선택해 추천을 정교화합니다.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
