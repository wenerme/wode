import { fileURLToPath } from 'node:url';
import path from 'node:path';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);

// For building on vercel: https://github.com/Automattic/node-canvas/issues/1779
if (
  process.env.LD_LIBRARY_PATH == null ||
  !process.env.LD_LIBRARY_PATH.includes(
    `${process.env.PWD}/node_modules/canvas/build/Release:`,
  )
) {
  process.env.LD_LIBRARY_PATH = `${
    process.env.PWD
  }/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ''}`;
}
// LD_LIBRARY_PATH=/vercel/path0/node_modules/canvas/build/Release:/var/task/node_modules/canvas/build/Release

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wener/reaction', '@wener/utils', '@wener/tiptap', '@wener/data', 'common'],
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['canvas'],
    // swcPlugins: [['next-superjson-plugin', {}]],
    appDir: true,
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

if (process.env.STANDALONE) {
  nextConfig.output = 'standalone';
}

export default nextConfig;
