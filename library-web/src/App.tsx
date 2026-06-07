import { Routes, Route, useLocation } from 'react-router-dom'
import { Header } from './shell/Header'
import { Footer } from './shell/Footer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CataloguePage } from './routes/CataloguePage'
import { DetailPage } from './routes/DetailPage'
import { NotFoundPage } from './routes/NotFoundPage'

export default function App() {
  const location = useLocation()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex-1">
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<CataloguePage />} />
            <Route path="/q/:id" element={<DetailPage />} />
            <Route path="/q/:id/:version" element={<DetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </div>
      <Footer />
    </div>
  )
}
