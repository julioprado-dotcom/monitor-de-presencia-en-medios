import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    // Tree-shake lucide-react (42 iconos): solo打包用户实际使用的图标
    optimizePackageImports: [
      'lucide-react',
      '@base-ui/react',
      'framer-motion',
    ],
  },

  // Cache de API routes: stale-while-revalidate 60s para stats
  async headers() {
    return [
      {
        source: '/api/stats',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' },
        ],
      },
    ];
  },
};

export default nextConfig;
