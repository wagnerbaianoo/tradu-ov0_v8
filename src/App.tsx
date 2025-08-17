import React from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

// Import pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EventsPage from './pages/EventsPage'
import AdminPage from './pages/AdminPage'
import TranslatorPage from './pages/TranslatorPage'
import EventPage from './pages/EventPage'
import LivePage from './pages/LivePage'
import SetupAdminPage from './pages/SetupAdminPage'
import SystemValidationPage from './pages/SystemValidationPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
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
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  )
}