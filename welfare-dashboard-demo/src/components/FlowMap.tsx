import React, { useMemo } from 'react'

type Step = 0 | 1 | 2

type Node = {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  variant?: 'primary' | 'action'
  onClick?: () => void
}

type Edge = { from: string; to: string }

export default function FlowMap({ openWizard }: { openWizard: (step?: Step) => void }) {
  const nodes: Node[] = useMemo(() => [
    // Left region: 홈화면
    { id: 'home-title', label: '홈화면', x: 40, y: 32, w: 120, h: 34 },
    { id: 'asset', label: '자산 입력', x: 90, y: 110, w: 120, h: 36, variant: 'primary', onClick: () => openWizard(0) },
    { id: 'welfare', label: '복지 추천', x: 90, y: 170, w: 120, h: 36, variant: 'action', onClick: () => openWizard(1) },
    { id: 'dsa', label: 'DSA 갈아타기', x: 90, y: 230, w: 140, h: 36, variant: 'action', onClick: () => openWizard(2) },
    { id: 'goal', label: '목표 금액 D-DAY', x: 320, y: 230, w: 150, h: 36 },

    // Top middle search
    { id: 'topbar', label: '홈헤더', x: 640, y: 60, w: 120, h: 34 },
    { id: 'search', label: '마이 페이지 검색', x: 560, y: 120, w: 160, h: 36 },

    // 상담/간편송금
    { id: 'consult', label: 'AI/챗봇 상담', x: 760, y: 160, w: 140, h: 36 },
    { id: 'transfer', label: '간편송금', x: 940, y: 160, w: 120, h: 36 },

    // 마이데이터 → 나의정보선택 → 조건 선택
    { id: 'mydata', label: '마이데이터', x: 880, y: 260, w: 120, h: 36 },
    { id: 'profile', label: '나의정보선택', x: 1040, y: 260, w: 140, h: 36 },
    { id: 'region', label: '지역 선택', x: 1180, y: 220, w: 110, h: 34 },
    { id: 'job', label: '직업 선택', x: 1180, y: 260, w: 110, h: 34 },
    { id: 'age', label: '나이 선택', x: 1180, y: 300, w: 110, h: 34 },
    { id: 'pref', label: '선호도 선택', x: 1180, y: 340, w: 120, h: 34 },

    // 복지/금융 라인
    { id: 'benefit', label: '복지', x: 1350, y: 300, w: 80, h: 36 },
    { id: 'finance', label: '금융', x: 1350, y: 360, w: 80, h: 36 },

    // 복지 카테고리
    { id: 'house', label: '주거', x: 1460, y: 280, w: 80, h: 32 },
    { id: 'jobline', label: '일자리', x: 1560, y: 280, w: 80, h: 32 },
    { id: 'rights', label: '인권', x: 1660, y: 280, w: 80, h: 32 },
    { id: 'edu', label: '평생교육', x: 1760, y: 280, w: 100, h: 32 },

    // 금융 카테고리
    { id: 'deposit', label: '예적금', x: 1460, y: 360, w: 80, h: 32, onClick: () => openWizard(2) },
    { id: 'invest', label: '투자', x: 1560, y: 360, w: 80, h: 32 },

  ], [openWizard])

  const edges: Edge[] = useMemo(() => [
    // left region links
    { from: 'asset', to: 'welfare' },
    { from: 'welfare', to: 'dsa' },
    { from: 'dsa', to: 'goal' },

    // top flow
    { from: 'search', to: 'consult' },
    { from: 'consult', to: 'transfer' },

    // profile selection → benefit/finance
    { from: 'mydata', to: 'profile' },
    { from: 'profile', to: 'region' },
    { from: 'profile', to: 'job' },
    { from: 'profile', to: 'age' },
    { from: 'profile', to: 'pref' },
    { from: 'pref', to: 'benefit' },
    { from: 'pref', to: 'finance' },

    // categories
    { from: 'benefit', to: 'house' },
    { from: 'house', to: 'jobline' },
    { from: 'jobline', to: 'rights' },
    { from: 'rights', to: 'edu' },
    { from: 'finance', to: 'deposit' },
    { from: 'deposit', to: 'invest' },
  ], [])

  const map = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes])

  function center(n: Node) { return { cx: n.x + n.w/2, cy: n.y + n.h/2 } }

  return (
    <div className="flow-wrap">
      <div className="flow-canvas">
        <svg className="flow-svg" viewBox="0 0 1800 1000">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#334155" />
            </marker>
          </defs>
          {/* connectors */}
          {edges.map((e, i) => {
            const a = map[e.from]; const b = map[e.to]
            if (!a || !b) return null
            const { cx: x1, cy: y1 } = center(a)
            const { cx: x2, cy: y2 } = center(b)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={2} markerEnd="url(#arrow)" />
          })}
        </svg>

        {/* Left blue region */}
        <div className="flow-region" style={{ left: 20, top: 20, width: 520, height: 420 }}>
          <div className="label">홈화면</div>
        </div>

        {/* nodes */}
        {nodes.map(n => (
          <div key={n.id} className={`flow-node ${n.variant || ''}`} style={{ left: n.x, top: n.y, width: n.w, height: n.h }}>
            <div className="box" onClick={n.onClick} title={n.label} style={{ width: n.w, height: n.h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {n.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

