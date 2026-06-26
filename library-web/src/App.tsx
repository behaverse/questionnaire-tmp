import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Header } from './shell/Header'
import { Footer } from './shell/Footer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CataloguePage } from './routes/CataloguePage'
import { DetailPage } from './routes/DetailPage'
import { NotFoundPage } from './routes/NotFoundPage'

export default function App() {
  const location = useLocation()
  // On client-side navigation, move focus to the new page's main region so keyboard / screen-reader
  // users land on the new content instead of a stale focus point. Skip the initial render.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    document.getElementById('main-content')?.focus()
  }, [location.pathname])
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only rounded-lg focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper focus:shadow-card"
      >
        Skip to content
      </a>
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
