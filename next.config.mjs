/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.coles.com.au',
      },
      {
        protocol: 'https',
        hostname: '**.woolworths.com.au',
      },
    ],
  },
}

export default nextConfig
