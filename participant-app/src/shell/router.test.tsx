import { test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRoute, navigate, Link } from './router'

beforeEach(() => { window.history.pushState(null, '', '/') })

function Probe() {
  const route = useRoute()
  return (
    <div>
      <span data-testid="route">{route}</span>
      <Link to="/my-data">go-mydata</Link>
    </div>
  )
}

test('useRoute reflects navigate and preserves viewer_url/identity_url', () => {
  window.history.pushState(null, '', '/?viewer_url=http://vs&identity_url=http://id&other=x')
  render(<Probe />)
  navigate('/account')
  expect(screen.getByTestId('route').textContent).toBe('/account')
  expect(window.location.search).toContain('viewer_url=http%3A%2F%2Fvs')
  expect(window.location.search).toContain('identity_url=http%3A%2F%2Fid')
  expect(window.location.search).not.toContain('other=')
})

test('Link click navigates without a full reload', async () => {
  render(<Probe />)
  await userEvent.click(screen.getByText('go-mydata'))
  expect(screen.getByTestId('route').textContent).toBe('/my-data')
})

test('popstate updates the route', () => {
  render(<Probe />)
  navigate('/account')
  window.history.pushState(null, '', '/my-data')
  window.dispatchEvent(new PopStateEvent('popstate'))
  expect(screen.getByTestId('route').textContent).toBe('/my-data')
})
