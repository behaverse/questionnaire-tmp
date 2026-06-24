import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ParticipantApp } from './shell/ParticipantApp'
import { parseParams } from './params'
import { SessionProvider } from '@behaverse/participant-session'

const params = parseParams(window.location.search)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider identityBaseUrl={params.identityBaseUrl}>
      <ParticipantApp />
    </SessionProvider>
  </StrictMode>,
)
