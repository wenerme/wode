import { fileURLToPath } from 'node:url';
import path from 'node:path';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  swcMinify: true,
  experimental: {
    transpilePackages: ['@wener/reaction', '@wener/utils', '@wener/tiptap'],

    swcPlugins: [
      [
        'next-superjson-plugin',
        {
          excluded: [],
        },
      ],
    ],
    appDir: false,
    outputFileTracingRoot: path.join(__dirname, '../../'),
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: process.env.BASE_PATH,
};

export default nextConfig;
