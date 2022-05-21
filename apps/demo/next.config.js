const withTM = require('next-transpile-modules')(['@wener/reaction', '@wener/utils']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withTM(nextConfig);
