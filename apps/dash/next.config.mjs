import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';
console.log(`NextJS:`, { isDev, __dirname, cwd: process.cwd(), PORT: process.env.PORT });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['server'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    optimizePackageImports: ['react-icons', 'antd'],
    serverComponentsExternalPackages: [
      'ws',
      'nats.ws',
      'bcrypt',
      'better-sqlite3',
      '@mikro-orm/core',
      '@mikro-orm/nestjs',
      '@mikro-orm/mongodb',
      '@mikro-orm/mysql',
      '@mikro-orm/mariadb',
      '@mikro-orm/sqlite',
      '@mikro-orm/better-sqlite',
      '@mikro-orm/postgresql',
      '@mikro-orm/entity-generator',
      '@mikro-orm/migrations',
      '@mikro-orm/seeder',
      '@nestjs/common',
      '@nestjs/config',
      '@nestjs/core',
      '@nestjs/swagger',
    ],
  },
  images: {
    //  domains: ['s3.wener.me'],
  },
  output: 'standalone',
  env: {
    BUILD_DATE: new Date().toJSON(),
    CI_COMMIT_SHORT_SHA: process.env.CI_COMMIT_SHORT_SHA,
    CI_COMMIT_TIMESTAMP: process.env.CI_COMMIT_TIMESTAMP,
    CI_COMMIT_TAG: process.env.CI_COMMIT_TAG,
    CI_COMMIT_REF_NAME: process.env.CI_COMMIT_REF_NAME,
    CI_COMMIT_BRANCH: process.env.CI_COMMIT_BRANCH,
    BASE_PATH: process.env.BASE_PATH,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: process.env.BASE_PATH,
  webpack: (config, { isServer, webpack }) => {
    // https://github.com/typestack/class-transformer/issues/563
    const lazyImports = [
      '@nestjs/microservices/microservices-module',
      '@nestjs/websockets/socket-module',
      'class-transformer/storage',
      'ws',
      'nats.ws',
      'canvas',
      'jsdom',
    ];
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource, context) {
            if (lazyImports.includes(resource)) {
              try {
                require.resolve(resource);
              } catch (err) {
                return true;
              }
            }
            return false;
          },
        }),
      );
    }

    // https://github.com/tailwindlabs/headlessui/issues/2677#issuecomment-1683307508
    // {
    //   let modularizeImports = null;
    //   config.module.rules.some((rule) =>
    //     rule.oneOf?.some((oneOf) => {
    //       modularizeImports = oneOf?.use?.options?.nextConfig?.modularizeImports;
    //       return modularizeImports;
    //     }),
    //   );
    //   if (modularizeImports?.['@headlessui/react']) delete modularizeImports['@headlessui/react'];
    // }
    return config;
  },
};
export default nextConfig;
