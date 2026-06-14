import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ScoreSummary } from './ScoreSummary'

const scores = [{ id: 'phq9_total', name: 'PHQ-9 Total' }, { id: 'phq9_severity', name: 'Severity' }]

test('renders each named score with its value; null → em-dash; axe-clean', async () => {
  const score = (id: string) => (id === 'phq9_total' ? 12 : null)
  const { container } = render(<ScoreSummary title="Your results" scores={scores} score={score} />)
  expect(screen.getByText('PHQ-9 Total')).toBeInTheDocument()
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Severity')).toBeInTheDocument()
  expect(screen.getByText('—')).toBeInTheDocument()
  expect(await axe(container)).toHaveNoViolations()
})
test('renders nothing when there are no scores', () => {
  const { container } = render(<ScoreSummary title="X" scores={[]} score={() => null} />)
  expect(container.firstChild).toBeNull()
})
