import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StandalonePreview } from './preview/StandalonePreview'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StandalonePreview />
  </StrictMode>,
)
