import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { parseParams } from './app/bootstrap'
import { SessionProvider } from '@behaverse/participant-session'
import { ReplayApp } from './replay/ReplayApp'

// web-viewer is now the player only — the portal lives in the participant-app package.
// The player still uses the session: authenticated deployments either accept a one-time SSO
// handoff code from the portal (no re-login) or fall back to the player's own LoginView.
const params = parseParams(window.location.search)

// Strip the (single-use) handoff code from the URL so a reload/history entry doesn't carry it;
// it's already captured below and passed to the provider.
if (params.handoff) {
  const u = new URL(window.location.href)
  u.searchParams.delete('handoff')
  window.history.replaceState(null, '', u.toString())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {params.replay
      ? <ReplayApp src={params.replay} themeParam={params.theme} follow={params.follow} />
      : (
        <SessionProvider identityBaseUrl={params.identityBaseUrl} handoffCode={params.handoff ?? undefined}>
          <App />
        </SessionProvider>
      )}
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
