import React from 'react'
import RegisterForm from '../components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white mb-2 text-3xl font-light">Plurall Simultâneo</h1>
          <p className="text-gray-400 text-sm">Criar nova conta</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}