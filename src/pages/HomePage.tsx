import React from 'react'
import { Navigate } from 'react-router-dom'

export default function HomePage() {
  return <Navigate to="/auth/login" replace />
}