import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const TranslatorPage = lazy(() => import('./pages/TranslatorPage'))
const EventPage = lazy(() => import('./pages/EventPage'))
const LivePage = lazy(() => import('./pages/LivePage'))
const SetupAdminPage = lazy(() => import('./pages/SetupAdminPage'))
const SystemValidationPage = lazy(() => import('./pages/SystemValidationPage'))

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <ErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white">Carregando...</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/translator" element={<TranslatorPage />} />
              <Route path="/event/:id" element={<EventPage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/setup/create-admin" element={<SetupAdminPage />} />
              <Route path="/system/validation" element={<SystemValidationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  )
}