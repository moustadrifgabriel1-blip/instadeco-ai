/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclure complètement undici côté client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'replicate.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;
