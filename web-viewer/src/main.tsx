import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { HomeApp } from './home/HomeApp'
import { parseParams } from './app/bootstrap'

// The root entry doubles as the participant landing page: with no questionnaire
// selected it shows the catalogue ("pick a questionnaire"); an explicit
// deployment / invite / fixture param runs the questionnaire in the viewer.
const params = parseParams(window.location.search)
const runQuestionnaire = Boolean(params.deploymentId || params.invite || params.fixture)

createRoot(document.getElementById('root')!).render(
  <StrictMode>{runQuestionnaire ? <App /> : <HomeApp />}</StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
