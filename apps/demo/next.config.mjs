import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';
console.log(`NextJS:`, { isDev, __dirname, cwd: process.cwd(), PORT: process.env.PORT });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@wener/reaction', '@wener/utils', '@wener/tiptap','server'],
  experimental: {
    serverActions: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
    optimizePackageImports: ['react-icons', 'antd'],
    serverComponentsExternalPackages: [
      'ws',
      'nats.ws',
      'bcrypt',
      'better-sqlite3',
      '@mikro-orm/better-sqlite',
      '@mikro-orm/core',
      '@mikro-orm/entity-generator',
      '@mikro-orm/mariadb',
      '@mikro-orm/migrations',
      '@mikro-orm/mongodb',
      '@mikro-orm/mysql',
      '@mikro-orm/nestjs',
      '@mikro-orm/postgresql',
      '@mikro-orm/seeder',
      '@mikro-orm/sqlite',
      '@nestjs/common',
      '@nestjs/config',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/swagger',
    ],
  },
  images: {
  },
  // output: 'standalone',
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
      '@mikro-orm/better-sqlite',
      '@mikro-orm/core',
      '@mikro-orm/entity-generator',
      '@mikro-orm/mariadb',
      '@mikro-orm/migrations',
      '@mikro-orm/mongodb',
      '@mikro-orm/mysql',
      '@mikro-orm/nestjs',
      '@mikro-orm/postgresql',
      '@mikro-orm/seeder',
      '@mikro-orm/sqlite',
      '@nestjs/platform-express',
      '@nestjs/microservices',
      '@nestjs/core',
      '@nestjs/microservices/microservices-module',
      '@nestjs/websockets/socket-module',
      'class-transformer/storage',
      'ws',
      'nats',
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
                // console.log(`Ignore ${resource} ${err}`)
                return true;
              }
            }
            return false;
          },
        }),
      );
    }

    // 内置
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
