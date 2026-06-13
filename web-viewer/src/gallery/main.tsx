import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { THEMES } from '../theme/registry'

const FIXTURES = ['widgets', 'mini', 'matrix', 'branch'] as const
const ids = Object.keys(THEMES)

function Gallery() {
  const [fixture, setFixture] = useState<(typeof FIXTURES)[number]>('widgets')
  const [solo, setSolo] = useState<string | 'all'>('all')
  const shown = solo === 'all' ? ids : [solo]
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#15181d', color: '#e7ecf2', minHeight: '100vh' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 18px', borderBottom: '1px solid #2b323b', position: 'sticky', top: 0, background: '#15181d', zIndex: 5 }}>
        <strong style={{ fontSize: 15 }}>Theme Gallery</strong>
        <span style={{ color: '#9aa4b2', fontSize: 12 }}>Live viewer per theme — single source of truth (src/theme/registry.ts).</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: '#9aa4b2' }}>Fixture{' '}
            <select value={fixture} onChange={(e) => setFixture(e.target.value as never)}>
              {FIXTURES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <button onClick={() => setSolo('all')}>All</button>
          {ids.map((id) => <button key={id} onClick={() => setSolo(id)}>{THEMES[id].name}</button>)}
        </span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: solo === 'all' ? 'repeat(3, 1fr)' : '1fr', gap: 14, padding: 14 }}>
        {shown.map((id) => (
          <figure key={id} style={{ margin: 0, background: '#0e1116', borderRadius: 11, overflow: 'hidden' }}>
            <figcaption style={{ padding: '7px 11px', fontSize: 13 }}><b>{THEMES[id].name}</b> <span style={{ color: '#9aa4b2' }}>{id}</span></figcaption>
            <iframe title={id} src={`/?fixture=${fixture}&theme=${id}`} style={{ width: '100%', height: solo === 'all' ? 520 : 760, border: 0, display: 'block', background: '#fff' }} />
          </figure>
        ))}
      </div>
    </div>
  )
}

createRoot(document.getElementById('gallery-root')!).render(<Gallery />)
