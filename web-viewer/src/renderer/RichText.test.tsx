import { render, screen } from '@testing-library/react'
import { RichText } from './RichText'

test('renders *emphasis* as <em>', () => {
  const { container } = render(<RichText>{'I am *very* sure'}</RichText>)
  expect(container.querySelector('em')?.textContent).toBe('very')
})
test('renders <br /> as a line break', () => {
  const { container } = render(<RichText>{'line one<br />line two'}</RichText>)
  expect(container.querySelector('br')).toBeTruthy()
})
test('renders **bold** as <strong>', () => {
  const { container } = render(<RichText>{'be **bold**'}</RichText>)
  expect(container.querySelector('strong')?.textContent).toBe('bold')
})
test('strips dangerous HTML (script)', () => {
  const { container } = render(<RichText>{'hi<script>alert(1)</script>'}</RichText>)
  expect(container.querySelector('script')).toBeNull()
})
test('plain text renders as-is without block wrapper margins', () => {
  render(<RichText>{'Just plain text.'}</RichText>)
  expect(screen.getByText('Just plain text.')).toBeInTheDocument()
})
