const overallScore = 68

const programs = [
  {
    title: '기초생활보장 생계급여',
    tone: 'green',
    status: '신청 추천',
    detail: '재산점수 48점 (기준 60점 이하) · 근로소득 인정 70% 반영으로 소득인정액 136만원',
    action: '복지로 사전예약 후 6월 10일 제출 권장'
  },
  {
    title: '전세·월세 지원(청년형)',
    tone: 'yellow',
    status: '조건 검토',
    detail: '보증금 900만원, 월세 46만원 → 지원 상한 50만원 대비 여유 4만원',
    action: '최근 3개월 소득증빙 및 임대차계약서 추가 업로드 필요'
  },
  {
    title: '햇살론15 긴급대출',
    tone: 'red',
    status: '기준 초과',
    detail: '연소득 3,360만원 · DSR 42%로 40% 기준 초과, 부채 감축 필요',
    action: 'DSA 추천 경로를 참고해 금융부채 300만원 상환 시 재심의 가능'
  }
]

const timeline = [
  {
    period: '6월 초',
    label: '생계급여 접수',
    tone: 'green',
    detail: '정부 재산점수 기준 충족. 온라인 서류 제출 후 3주 내 1차 결과 안내'
  },
  {
    period: '7월',
    label: '월세 지원 검증',
    tone: 'yellow',
    detail: '임차료 계좌이체 내역 업로드 마감. 보증금 인상 시 추가 보증보험 검토'
  },
  {
    period: '9월',
    label: 'DSR 재평가',
    tone: 'red',
    detail: '햇살론 재신청 전까지 마이데이터 상 부채잔액 10% 이상 축소 필요'
  }
]

const breakdown = [
  { label: '재산점수', value: 48, limit: 60, tone: 'green' },
  { label: '소득인정액', value: 136, limit: 140, tone: 'yellow' },
  { label: '부채 DSR', value: 42, limit: 40, tone: 'red' }
]

export default function MyDataWelfarePage({ navigate }: { navigate: (path: string) => void }) {
  const gaugeNeedle = Math.min(Math.max(overallScore, 4), 96)

  return (
    <div className="panel welfare-diagnosis">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-title" style={{ fontSize: 13, color: '#38bdf8' }}>정부 재산점수 기반 분석</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>마이데이터 복지 진단</div>
          <div className="muted" style={{ marginTop: 6 }}>
            공공 API · 마이데이터 결합 빅데이터로 산출한 자격 판정 결과입니다.
          </div>
        </div>
        <div className="welfare-gauge">
          <div className="gauge-score">
            {overallScore}
            <span>점</span>
          </div>
          <div className="gauge-track">
            <div className="gauge-gradient" />
            <div className="gauge-needle" style={{ left: `${gaugeNeedle}%` }} />
          </div>
          <div className="gauge-labels">
            <span>위험</span>
            <span>주의</span>
            <span>안정</span>
          </div>
        </div>
      </div>

      <div className="grid cols-3 welfare-grid">
        {programs.map((program) => (
          <div key={program.title} className={`welfare-card ${program.tone}`}>
            <div className="welfare-card-head">
              <div className="badge tone">{program.status}</div>
              <div className="welfare-card-title">{program.title}</div>
            </div>
            <div className="welfare-card-body">
              <div className="welfare-card-detail">{program.detail}</div>
              <div className="welfare-card-action">{program.action}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid cols-3 welfare-breakdown">
        {breakdown.map((item) => (
          <div key={item.label} className={`card breakdown ${item.tone}`}>
            <div className="label">{item.label}</div>
            <div className="value">
              <strong>{item.value}</strong>
              <span className="unit">{item.label === '소득인정액' ? '만원' : '점'}</span>
            </div>
            <div className="chart">
              <div
                className={`bar ${item.tone}`}
                style={{ width: `${Math.min(item.value / item.limit, 1) * 100}%` }}
              />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              기준값 {item.limit}
              {item.label === '소득인정액' ? '만원' : item.label === '부채 DSR' ? '%' : '점'} 대비
            </div>
          </div>
        ))}
      </div>

      <div className="timeline">
        <div className="section-title" style={{ fontSize: 16, marginBottom: 14 }}>보조금/혜택 타이밍 안내</div>
        <div className="timeline-list">
          {timeline.map((item) => (
            <div key={item.label} className={`timeline-item ${item.tone}`}>
              <div className="timeline-period">{item.period}</div>
              <div>
                <div className="timeline-label">{item.label}</div>
                <div className="timeline-detail">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn secondary" onClick={() => navigate('/mydata')}>뒤로가기</button>
        <button className="btn" onClick={() => navigate('/wizard/1')}>상세 추천 이동</button>
      </div>
    </div>
  )
}
