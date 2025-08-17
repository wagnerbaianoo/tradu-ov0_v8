"use client"

import dynamic from "next/dynamic"

// Import admin components dynamically without SSR to avoid hydration issues
const AdminDashboardClient = dynamic(() => import("@/components/admin/admin-dashboard-client"), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white">Carregando painel administrativo...</div>
    </div>
  )
})

export default function AdminDashboard() {
  return <AdminDashboardClient />
}