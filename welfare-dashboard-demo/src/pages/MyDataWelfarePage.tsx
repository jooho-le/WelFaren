import { useEffect, useMemo, useState } from 'react'
import { fetchRecommendationsWithMeta, diagnoseIncome, type RecommendationItem, type RecommendResponseMeta } from '@/api/welfare'
import type { AssetFormData } from '@/components/AssetInput'

const overallScore = 68

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

export default function MyDataWelfarePage({ navigate, data, authed }: { navigate: (path: string) => void, data?: AssetFormData, authed?: boolean }) {
  const [items, setItems] = useState<RecommendationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<RecommendResponseMeta | null>(null)
  const [diag, setDiag] = useState<{ total: number; perCapita: number; grade?: string } | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchRecommendationsWithMeta()
      .then(({ items: list, meta }) => { if (alive) { setItems(list); setMeta(meta); setError(null) } })
      .catch(err => { if (alive) setError(err?.message || '불러오기에 실패했습니다') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true
    if (data) {
      const total_assets = (data.realEstate || 0) + (data.deposits || 0) + (data.otherAssets || 0)
      diagnoseIncome({ household_size: data.householdSize, monthly_income: data.monthlyIncome, total_assets })
        .then(r => {
          if (!alive) return
          const total = Math.round(r.recognized_income)
          const perCapita = Math.round(total / Math.max(1, data.householdSize))
          setDiag({ total, perCapita, grade: r.grade })
        })
        .catch(() => { /* 진단 실패 시 표시만 생략 */ })
    }
    return () => { alive = false }
  }, [data])

  const overall = useMemo(() => {
    if (!items.length) return overallScore
    const top3 = items.slice(0, 3)
    const avg = top3.reduce((s, x) => s + (x.score || 0), 0) / top3.length
    return Math.round(avg)
  }, [items])
  const gaugeNeedle = Math.min(Math.max(overall, 4), 96)

  return (
    <div className="panel welfare-diagnosis">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-title" style={{ fontSize: 13, color: '#38bdf8' }}>정부 재산점수 기반 분석</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>마이데이터 복지 진단</div>
          <div className="muted" style={{ marginTop: 6 }}>
            공공 API · 마이데이터 결합 빅데이터로 산출한 자격 판정 결과입니다.
          </div>
          {!authed && (
            <div className="muted" style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              해당 내용은 예시입니다. 회원가입/로그인 후 본인의 정보를 확인할 수 있습니다.
            </div>
          )}
        </div>
        <div className="welfare-gauge">
          <div className="gauge-score">
            {overall}
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
        {loading && <div className="muted">추천을 불러오는 중…</div>}
        {error && !loading && <div className="muted">오류: {error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="muted">추천 결과가 없습니다. 나의정보선택에서 지역/직업/나이를 설정해보세요.</div>
        )}
        {!loading && !error && items.map((p) => (
          <div key={p.id} className={`welfare-card ${toneByScore(p.score)}`}>
            <div className="welfare-card-head">
              <div className="badge tone">{badgeByScore(p.score)}</div>
              <div className="welfare-card-title">{p.name}</div>
            </div>
            <div className="welfare-card-body">
              <div className="welfare-card-detail">{p.summary || (p.categories?.length ? p.categories.join(' · ') : '맞춤 추천 항목')}</div>
              <div className="muted" style={{ marginTop: 6 }}>제공기관: {p.provider || '중앙부처/지자체'}</div>
              <div className="welfare-card-action" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {linksForProgram(p).map((lnk, i) => (
                  <a key={i} className="btn link" href={lnk.href} target="_blank" rel="noreferrer">{lnk.label}</a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 적용 내역 & 데이터 출처 */}
      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="section-title">필터 적용 내역</div>
          <div className="muted">나의정보선택에서 설정한 값으로 백엔드가 추천을 생성합니다.</div>
          <div style={{ marginTop: 8 }}>
            <div>지역: {readProfile('region') || '미선택'} {meta?.filters?.region_code ? `(코드 ${meta.filters.region_code})` : ''}</div>
            <div>직업: {readProfile('job') || '미선택'}</div>
            <div>나이: {readProfile('age') || '미선택'}</div>
            <div>선호도: {readProfile('pref') || '미선택'}</div>
          </div>
        </div>
        <div className="card">
          <div className="section-title">데이터 출처</div>
          {meta ? (
            <div>
              <div>소스: {meta.used_mock ? '샘플 데이터(로컬)' : '실제 공공데이터 API'}</div>
              {!meta.used_mock && (
                <div className="muted" style={{ marginTop: 6 }}>{meta.api_base}{meta.list_path}</div>
              )}
            </div>
          ) : (
            <div className="muted">확인 중…</div>
          )}
        </div>
      </div>

      <div className="grid cols-3 welfare-breakdown">
        <div className={`card breakdown green`}>
          <div className="label">소득인정액</div>
          <div className="value">
            <strong>{diag ? Math.round(diag.total / 10000) : 136}</strong>
            <span className="unit">만원</span>
          </div>
          <div className="chart">
            <div className={`bar green`} style={{ width: `${Math.min((diag ? (diag.total / 10000) : 136) / 140, 1) * 100}%` }} />
          </div>
          <div className="muted" style={{ fontSize: 12 }}>백엔드 계산값(소득인정액) 기준</div>
        </div>
        <div className={`card breakdown yellow`}>
          <div className="label">추천 점수</div>
          <div className="value">
            <strong>{overall}</strong>
            <span className="unit">점</span>
          </div>
          <div className="chart">
            <div className={`bar yellow`} style={{ width: `${Math.min(overall / 100, 1) * 100}%` }} />
          </div>
          <div className="muted" style={{ fontSize: 12 }}>백엔드 스코어(선호/지역/연령/직업 기반)</div>
        </div>
        {!authed && (
          <div className={`card breakdown red`}>
            <div className="label">참고 타임라인</div>
            <div className="value">
              <strong>예시</strong>
              <span className="unit">데모</span>
            </div>
            <div className="chart">
              <div className={`bar red`} style={{ width: `40%` }} />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>타임라인은 현재 데모 예시입니다</div>
          </div>
        )}
      </div>

      {!authed && (
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
      )}

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn secondary" onClick={() => navigate('/mydata')}>뒤로가기</button>
        <button className="btn" onClick={() => navigate('/wizard/1')}>상세 추천 이동</button>
      </div>
    </div>
  )
}

function toneByScore(score?: number) {
  const s = score ?? 0
  if (s >= 75) return 'green'
  if (s >= 55) return 'yellow'
  return 'red'
}

function badgeByScore(score?: number) {
  const s = score ?? 0
  if (s >= 75) return '신청 추천'
  if (s >= 55) return '조건 검토'
  return '우선순위 낮음'
}

function readProfile(key: 'region' | 'job' | 'age' | 'pref'): string | undefined {
  try {
    const raw = localStorage.getItem('profileSelections')
    if (!raw) return undefined
    const obj = JSON.parse(raw)
    const val = obj?.[key]
    return typeof val === 'string' ? val : undefined
  } catch {
    return undefined
  }
}

function linksForProgram(p: { url?: string; name: string }) {
  const res: Array<{ href: string; label: string }> = []
  const name = p.name?.trim() || ''
  const url = (p.url || '').trim()
  if (url && url.startsWith('http')) {
    try {
      const u = new URL(url)
      if (u.hostname.includes('gov.kr')) res.push({ href: url, label: '정부24 상세보기' })
      else if (u.hostname.includes('bokjiro.go.kr')) res.push({ href: url, label: '복지로 상세보기' })
      else if (u.hostname.includes('mohw.go.kr')) res.push({ href: url, label: '보건복지부 상세보기' })
      else res.push({ href: url, label: '상세 페이지 열기' })
    } catch { /* ignore */ }
  }
  // 정부24 검색 (여러 경로 후보)
  if (name) {
    res.push({ href: `https://www.gov.kr/portal/service/search?query=${encodeURIComponent(name)}`, label: '정부24 검색' })
    res.push({ href: `https://www.gov.kr/portal/search?srchWord=${encodeURIComponent(name)}`, label: '정부24 검색(대안)' })
    // 복지로/구글 보조 검색
    res.push({ href: `https://www.bokjiro.go.kr/welInfo/retriveWelInfoSerch.do?searchWrd=${encodeURIComponent(name)}`, label: '복지로 검색' })
    res.push({ href: `https://www.google.com/search?q=${encodeURIComponent(name + ' site:gov.kr OR site:bokjiro.go.kr')}`, label: '정부 사이트 통합검색' })
  }
  // 중복 제거 (첫 occurrence 우선)
  const seen = new Set<string>()
  return res.filter(r => !seen.has(r.href) && seen.add(r.href)).slice(0, 3)
}
