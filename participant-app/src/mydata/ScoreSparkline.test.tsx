import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreSparkline } from './ScoreSparkline'

const series = { id: 'sc', name: 'Total', points: [
  { date: '2026-01-01', value: 12 }, { date: '2026-02-01', value: 8 }, { date: '2026-03-01', value: 5 },
] }

describe('ScoreSparkline', () => {
  it('renders a labelled chart with a polyline and a data-table fallback', () => {
    const { container } = render(<ScoreSparkline series={series} />)
    expect(screen.getByRole('img', { name: /total over time/i })).toBeInTheDocument()
    const poly = container.querySelector('polyline')!
    expect(poly.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(3)   // one coord pair per point
    expect(screen.getAllByRole('row')).toHaveLength(4)                         // header + 3 data rows
    expect(screen.getAllByText('5')[0]).toBeInTheDocument()                     // latest value readout
  })

  it('renders nothing for fewer than two points', () => {
    const { container } = render(<ScoreSparkline series={{ id: 'sc', name: 'T', points: [{ date: '2026-01-01', value: 1 }] }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
