import { createRoot } from 'react-dom/client'
import { MyDataApp } from './MyDataApp'
import { SessionProvider } from '../session/SessionProvider'
import { parseParams } from '../app/bootstrap'
import '../index.css'

const { identityBaseUrl } = parseParams(window.location.search)
createRoot(document.getElementById('mydata-root')!).render(
  <SessionProvider identityBaseUrl={identityBaseUrl}><MyDataApp /></SessionProvider>,
)
