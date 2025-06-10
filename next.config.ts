/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable server actions for better performance
    serverActions: true,
  },
};

module.exports = nextConfig;