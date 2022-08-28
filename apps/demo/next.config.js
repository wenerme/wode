// const withTM = require('next-transpile-modules')(['@wener/reaction', '@wener/utils']);
import createTranspile from 'next-transpile-modules';
const withTM = createTranspile(['@wener/reaction', '@wener/utils', '@wener/tiptap']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: true,
  },
  swcMinify: true,
  experimental: {
    // https://github.com/pnpm/pnpm/issues/4663
    // outputStandalone: true,

    legacyBrowsers: false,
    browsersListForSwc: true,
  },
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback.fs = false;
  //   }
  //   return config;
  // },
  i18n: {
    locales: ['default', 'zh', 'en'],
    defaultLocale: 'default',
    localeDetection: false,
  },
};

// module.exports = withTM(nextConfig);
// module.exports = nextConfig;
export default withTM(nextConfig);
// export default nextConfig;
