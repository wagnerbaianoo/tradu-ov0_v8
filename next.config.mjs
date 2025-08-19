/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Apenas se você realmente precisa desativar a otimização
  },
  webpack: (config, { isServer }) => {
    // Configurações específicas para evitar erros com módulos Node.js no cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Adicione isto se estiver usando bibliotecas ESM problemáticas
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    return config;
  },
  // Adicione isto se estiver usando transpilação de pacotes específicos
  transpilePackages: [
    // Liste pacotes que precisam de transpilação adicional
  ],
}

export default nextConfig;
