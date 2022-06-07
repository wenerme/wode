const withTM = require('next-transpile-modules')(['@wener/reaction', '@wener/utils']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  i18n: {
    locales: ['default', 'zh', 'en'],
    defaultLocale: 'default',
    localeDetection: false,
  },
};

module.exports = withTM(nextConfig);
// module.exports = nextConfig;
