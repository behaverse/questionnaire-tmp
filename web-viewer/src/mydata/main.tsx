import { createRoot } from 'react-dom/client'
import { MyDataApp } from './MyDataApp'
import '../index.css'

createRoot(document.getElementById('mydata-root')!).render(<MyDataApp />)
