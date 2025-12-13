/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imágenes sin optimización server-side
  images: {
    unoptimized: true,
  },
  
  // Trailing slash para compatibilidad
  trailingSlash: true,
  
  // Ignorar errores durante build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Webpack config
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
