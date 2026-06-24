import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { parseParams } from './app/bootstrap'
import { SessionProvider } from '@behaverse/participant-session'

// web-viewer is now the player only — the portal lives in the participant-app package.
// The player still uses the session (for authenticated deployments it re-prompts login here).
const params = parseParams(window.location.search)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider identityBaseUrl={params.identityBaseUrl}>
      <App />
    </SessionProvider>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
