/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression gzip pour réduire la taille des assets
  compress: true,
  
  // Optimisations de build
  poweredByHeader: false,
  reactStrictMode: true,
  
  serverExternalPackages: ['undici', 'jsdom'],
  
  // Headers de sécurité
  async headers() {
    return [
      {
        // Pages dynamiques/interactives : cache court avec revalidation fréquente
        source: '/(essai|generate|dashboard|login|signup|credits|galerie|quiz|pricing)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate, s-maxage=60',
          },
        ],
      },
      {
        // Page d'accueil : cache court pour voir rapidement les mises à jour
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
          },
        ],
      },
      {
        // Appliquer à toutes les routes
        source: '/:path*',
        headers: [
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live; script-src-elem 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: https://*.supabase.co https://images.unsplash.com https://*.fal.media https://www.google-analytics.com https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.fal.ai https://*.fal.media https://generativelanguage.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://region1.google-analytics.com https://vercel.live; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests",
          },
        ],
      },
      {
        // Headers spécifiques pour les API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        // Cache long pour les pages programmatiques SEO (style, piece, villes)
        source: '/style/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/piece/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/architecte-interieur/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Cache modéré pour le blog (mis à jour 3x/jour)
        source: '/blog/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // RSS feed cache
        source: '/api/rss',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/rss+xml; charset=utf-8',
          },
        ],
      },
    ];
  },
  // Redirects SEO: uniformisation des URLs
  async redirects() {
    return [
      // Redirection www vers non-www (si applicable)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.instadeco.app' }],
        destination: 'https://instadeco.app/:path*',
        permanent: true,
      },
      // Trailing slash removal
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
    ];
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
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'tocgrsdlegabfkykhdrz.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'v3.fal.media',
      },
      {
        protocol: 'https',
        hostname: 'v3b.fal.media',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Optimiser les tailles d'images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache plus long pour les images
    minimumCacheTTL: 31536000, // 1 an
  },
};

module.exports = nextConfig;
