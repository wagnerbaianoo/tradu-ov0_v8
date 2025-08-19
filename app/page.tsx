import { EventAccessForm } from "@/components/event-access-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">TranslateEvent V5</h1>
          <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Sistema de Tradução Simultânea Profissional - Modo Demonstração
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-16 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <EventAccessForm />
        </div>

        <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-3xl font-bold text-white mb-8">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass rounded-xl p-8 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Painel Administrativo</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Gerencie eventos, streams, usuários e configurações do sistema
              </p>
              <a
                href="/admin"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
              >
                Acessar Admin
              </a>
            </div>

            <div className="glass rounded-xl p-8 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Painel do Tradutor</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Interface profissional para tradução simultânea em tempo real
              </p>
              <a
                href="/translator"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
              >
                Acessar Tradutor
              </a>
            </div>

            <div className="glass rounded-xl p-8 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:animate-pulse-glow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Stream ao Vivo</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">Assista transmissões ao vivo com tradução simultânea</p>
              <a
                href="/live"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Assistir Live
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
