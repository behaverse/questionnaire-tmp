import { createRoot } from 'react-dom/client'
import { HomeApp } from './HomeApp'
import '../index.css'

createRoot(document.getElementById('home-root')!).render(<HomeApp />)
