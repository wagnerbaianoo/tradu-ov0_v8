import React from 'react'
import { createClient } from '../lib/supabase/server'
import { Navigate } from 'react-router-dom'

export default function HomePage() {
  // For now, redirect to login since we can't use server-side auth in Vite
  return <Navigate to="/auth/login" replace />
}