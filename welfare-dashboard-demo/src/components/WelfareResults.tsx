import type { AssetFormData } from './AssetInput'

export default function WelfareResults({ data, incomeRecognition, eligibility }: {
  data: AssetFormData,
  incomeRecognition: { total: number, perCapita: number },
  eligibility: { baseEligible: boolean, microFinanceEligible: boolean },
}) {
  const recs: { title: string; desc: string; ok: boolean; tag: string }[] = [
    {
      title: '기초생활보장(생계·의료·주거·교육) 가능성',
      desc: '1인당 인정소득이 기준 이하인 경우 우선 검토 대상입니다.',
      ok: eligibility.baseEligible,
      tag: eligibility.baseEligible ? '검토 권장' : '기준 초과'
    },
    {
      title: '서민금융(햇살론·사잇돌 등)',
      desc: '가구 인정소득이 기준 이하이면 금융지원 자격 가능성이 있습니다.',
      ok: eligibility.microFinanceEligible,
      tag: eligibility.microFinanceEligible ? '가능성 높음' : '가능성 낮음'
    },
    {
      title: '맞춤 복지 찾기(지자체·바우처)',
      desc: '소득·가구구성에 따라 지역별 추가지원이 있을 수 있습니다.',
      ok: true,
      tag: '추가 탐색'
    },
  ]

  const ratio = Math.min(1, incomeRecognition.perCapita / 1_000_000)

  return (
    <div>
      <div className="section-title">복지 추천 결과</div>
      <div className="grid cols-2">
        <div className="card">
          <div className="muted">월 소득인정액</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{incomeRecognition.total.toLocaleString()}원</div>
            <div className="muted">(1인당 {incomeRecognition.perCapita.toLocaleString()}원)</div>
          </div>
          <div className="spacer" />
          <div className="muted" style={{ marginBottom: 6 }}>기준 대비 비율(가정치)</div>
          <div className="chart">
            <div className="bar" style={{ width: `${Math.max(12, ratio * 100)}%` }} />
          </div>
        </div>
        <div className="card">
          <div className="muted">가구 구성</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{data.householdSize}명</div>
          <div className="spacer" />
          <div className="muted">자산 구성</div>
          <div className="grid cols-3" style={{ marginTop: 8 }}>
            <div>
              <div className="muted">부동산</div>
              <div style={{ fontWeight: 700 }}>{data.realEstate.toLocaleString()}원</div>
            </div>
            <div>
              <div className="muted">예·적금</div>
              <div style={{ fontWeight: 700 }}>{data.deposits.toLocaleString()}원</div>
            </div>
            <div>
              <div className="muted">기타</div>
              <div style={{ fontWeight: 700 }}>{data.otherAssets.toLocaleString()}원</div>
            </div>
          </div>
        </div>
      </div>

      <div className="spacer" />
      <div className="grid cols-1">
        {recs.map((r, i) => (
          <div key={i} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{r.title}</div>
              <div className="muted">{r.desc}</div>
            </div>
            <span className={`badge ${r.ok ? 'ok' : 'warn'}`}>{r.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

