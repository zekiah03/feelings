/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // better-sqlite3 はネイティブモジュールなので webpack バンドルから外す
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
