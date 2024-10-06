import process from 'node:process';

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@wener/reaction', '@wener/console', 'common'],
  experimental: {
    swrDelta: 60,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // {
      //   hostname: 'localhost',
      // },
    ],
  },
  async rewrites() {
    const { SERVER_URL } = process.env;
    let redir = [
      {
        source: '/api/:path*',
        destination: `${SERVER_URL}/api/:path*`,
      },
    ];
    return redir;
  },
};

export default nextConfig;
