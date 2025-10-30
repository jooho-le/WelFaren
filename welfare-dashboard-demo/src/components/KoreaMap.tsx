import React, { useEffect, useMemo, useRef, useState } from 'react'

// 이 컴포넌트는 인라인 SVG 지도를 렌더링합니다.
// 자세한 도 경계가 들어있는 SVG를 assets에 두고 불러옵니다.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - raw svg string
import svgRaw from '../assets/korea map.svg?raw'

export default function KoreaMap({ onSelect, selected }: { onSelect: (name: string) => void, selected?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [labels, setLabels] = useState<Array<{ name: string, x: number, y: number }>>([])

  function toKorean(raw: string) {
    const s = (raw || '').toLowerCase().replace(/[^a-z]/g, '')
    const patterns: Array<[string, string]> = [
      ['seoul', '서울'],
      ['incheon', '인천'],
      ['busan', '부산'],
      ['daegu', '대구'],
      ['daejeon', '대전'],
      ['ulsan', '울산'],
      ['gwangju', '광주'],
      ['sejong', '세종'],
      ['gyeonggi', '경기'], ['kyonggi', '경기'], ['yeonggi', '경기'], ['gg', '경기'],
      ['gangwon', '강원'], ['kangwon', '강원'],
      ['chungbuk', '충북'], ['northchungcheong', '충북'], ['chungcheongbuk', '충북'], ['chungcheongbukdo', '충북'], ['cb', '충북'],
      ['chungnam', '충남'], ['southchungcheong', '충남'], ['chungcheongnam', '충남'], ['chungcheongnamdo', '충남'], ['cn', '충남'],
      ['jeonbuk', '전북'], ['northjeolla', '전북'], ['jeollabuk', '전북'], ['jeollabukdo', '전북'], ['jb', '전북'],
      ['jeonnam', '전남'], ['southjeolla', '전남'], ['jeollanam', '전남'], ['jeollanamdo', '전남'], ['jn', '전남'],
      ['gyeongbuk', '경북'], ['gyeongsangbuk', '경북'], ['gyeongsangbukdo', '경북'], ['kyungbuk', '경북'], ['gb', '경북'],
      ['gyeongnam', '경남'], ['gyeongsangnam', '경남'], ['gyeongsangnamdo', '경남'], ['kyungnam', '경남'], ['gn', '경남'],
      ['jeju', '제주'], ['jejudo', '제주'],
    ]
    for (const [key, ko] of patterns) {
      if (s.includes(key)) return ko
    }
    return raw
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: Event) => {
      const t = e.target as HTMLElement
      // Find nearest element with id or data-name
      const target = (t.closest('[data-name]') as HTMLElement) || (t.closest('[id]') as HTMLElement) || (t.closest('path,polygon,rect') as HTMLElement)
      let name = target?.getAttribute('data-name') || target?.getAttribute('id') || ''
      if (!name && target) {
        // Try to infer from nearest <text>
        const r = (target as any).getBoundingClientRect?.()
        if (r) {
          const inferred = nearestTextName(el, r.left + r.width/2, r.top + r.height/2)
          if (inferred) {
            name = inferred
            target.setAttribute('data-name', inferred)
          }
        }
      }
      const mapped = toKorean(name)
      if (mapped && mapped !== name && target) {
        target.setAttribute('data-name', mapped)
        name = mapped
      }
      if (!name && target) {
        // If the SVG has no labels, ask once and set it as data-name for this session
        const typed = window.prompt('선택한 지역의 이름을 입력하세요 (예: 서울)')
        if (typed) {
          target.setAttribute('data-name', typed)
          name = typed
          // persist user mapping in localStorage keyed by element index
          try {
            const map = JSON.parse(localStorage.getItem('regionLabels') || '{}')
            const key = ensureKey(target)
            map[key] = typed
            localStorage.setItem('regionLabels', JSON.stringify(map))
          } catch {}
        }
      }
      if (name) onSelect(name)
      // refresh labels after any change
      setTimeout(() => refreshLabels(), 0)
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [onSelect])

  useEffect(() => {
    // After first mount, apply stored labels to shapes without names
    const el = ref.current
    if (!el) return
    const shapes = Array.from(el.querySelectorAll('path, polygon, rect')) as HTMLElement[]
    const saved = (() => { try { return JSON.parse(localStorage.getItem('regionLabels') || '{}') } catch { return {} } })() as Record<string,string>
    shapes.forEach((s, i) => {
      const existing = s.getAttribute('data-name') || s.getAttribute('id')
      if (!existing) {
        const key = ensureKey(s, i)
        const label = saved[key]
        if (label) {
          s.setAttribute('data-name', label)
        } else {
          // Try infer from nearest <text>
          const r = (s as any).getBoundingClientRect?.()
          if (r) {
            const n = nearestTextName(el, r.left + r.width/2, r.top + r.height/2)
            if (n) s.setAttribute('data-name', toKorean(n))
          }
        }
      } else {
        const mapped = toKorean(existing)
        if (mapped && mapped !== existing) s.setAttribute('data-name', mapped)
      }
    })
    const onResize = () => refreshLabels()
    window.addEventListener('resize', onResize)
    refreshLabels()
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function ensureKey(elm: Element, fallbackIndex?: number) {
    let key = elm.getAttribute('data-key')
    if (!key) {
      key = (elm.getAttribute('id') || String(fallbackIndex ?? Array.from(elm.parentElement?.children || []).indexOf(elm as any)))
      elm.setAttribute('data-key', key)
    }
    return key
  }

  function refreshLabels() {
    const root = ref.current
    if (!root) return
    const svg = root.querySelector('svg')
    if (!svg) return
    const containerRect = (root as HTMLElement).getBoundingClientRect()
    const items: Array<{ name: string, x: number, y: number }> = []
    const sels = root.querySelectorAll('path, polygon, rect')
    sels.forEach((el) => {
      let rawName = (el.getAttribute('data-name') || el.getAttribute('id') || '').trim()
      if (!rawName) {
        // infer from nearest text
        const r = (el as any).getBoundingClientRect?.()
        if (r) rawName = nearestTextName(root, r.left + r.width/2, r.top + r.height/2) || ''
      }
      const name = toKorean(rawName)
      if (name && name !== rawName) el.setAttribute('data-name', name)
      if (!name) return
      const r = (el as any).getBoundingClientRect?.()
      if (!r || !r.width || !r.height) return
      const x = r.left - containerRect.left + r.width / 2
      const y = r.top - containerRect.top + r.height / 2
      items.push({ name, x, y })
    })
    setLabels(items)
  }

  function nearestTextName(root: Element, x: number, y: number): string | undefined {
    const texts = Array.from(root.querySelectorAll('text')) as SVGTextElement[]
    let best: { d: number; name: string } | undefined
    texts.forEach((t) => {
      const r = t.getBoundingClientRect?.()
      if (!r || !r.width || !r.height) return
      const cx = r.left + r.width/2
      const cy = r.top + r.height/2
      const dx = cx - x
      const dy = cy - y
      const d = Math.hypot(dx, dy)
      const raw = (t.textContent || '').trim()
      if (!raw) return
      if (!best || d < best.d) best = { d, name: raw }
    })
    // Only accept if reasonably close
    if (best && best.d < 120) return best.name
    return best?.name
  }

  useEffect(() => {
    // Apply selected highlight by id/data-name
    const el = ref.current
    if (!el) return
    el.querySelectorAll('.selected').forEach(n => n.classList.remove('selected'))
    if (!selected) return
    const sel = el.querySelector(`[data-name="${selected}"]`) || el.querySelector(`#${CSS.escape(selected)}`)
    sel?.classList.add('selected')
  }, [selected])

  return (
    <div className="map-wrap">
      <div ref={ref} className="map-root" dangerouslySetInnerHTML={{ __html: svgRaw }} />
      <div className="map-labels" aria-hidden>
        {labels.map((l, i) => (
          <span key={i} className="map-label" style={{ left: l.x, top: l.y }}>{l.name}</span>
        ))}
      </div>
      {/* Manual overlay hotspots to guarantee all regions are visible/clickable even if SVG lacks ids/text */}
      <div className="map-overlay">
        {HOTSPOTS.map(h => (
          <button
            key={h.name}
            className={`hotspot ${selected === h.name ? 'active' : ''}`}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            onClick={() => onSelect(h.name)}
            aria-label={`${h.name} 선택`}
          >{h.name}</button>
        ))}
      </div>
    </div>
  )
}

// Approximate anchor points for visible, clickable region buttons (percentage positions)
const HOTSPOTS: Array<{ name: string; x: number; y: number }> = [
  { name: '서울', x: 31, y: 29 },
  { name: '인천', x: 26, y: 32 },
  { name: '경기', x: 36, y: 34 },
  { name: '강원', x: 61, y: 24 },
  { name: '대전', x: 42, y: 55 },
  { name: '충남', x: 31, y: 52 },
  { name: '충북', x: 50, y: 50 },
  { name: '전북', x: 38, y: 65 },
  { name: '광주', x: 35, y: 77 },
  { name: '전남', x: 34, y: 84 },
  { name: '경북', x: 63, y: 53 },
  { name: '대구', x: 61, y: 61 },
  { name: '울산', x: 73, y: 66 },
  { name: '부산', x: 73, y: 73 },
  { name: '경남', x: 61, y: 70 },
  { name: '제주', x: 39, y: 96 },
]
