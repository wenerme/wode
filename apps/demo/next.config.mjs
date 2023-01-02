import { fileURLToPath } from 'node:url';
import path from 'node:path';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wener/reaction', '@wener/utils', '@wener/tiptap', '@wener/common'],
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  swcMinify: true,
  experimental: {
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: process.env.BASE_PATH,
};

export default nextConfig;
