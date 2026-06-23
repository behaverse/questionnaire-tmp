import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { ParticipantApp } from './shell/ParticipantApp'
import { parseParams } from './app/bootstrap'
import { SessionProvider } from './session/SessionProvider'

const params = parseParams(window.location.search)
const runQuestionnaire = Boolean(params.deploymentId || params.invite || params.fixture)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider identityBaseUrl={params.identityBaseUrl}>
      {runQuestionnaire ? <App /> : <ParticipantApp />}
    </SessionProvider>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
