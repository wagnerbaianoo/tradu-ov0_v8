/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Configurações específicas para evitar erros com módulos Node.js no cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
      };
    }
    
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    return config;
  },
  transpilePackages: [
    '@radix-ui/react-select',
    'lucide-react',
    '@supabase/supabase-js'
  ],
}

export default nextConfig;
