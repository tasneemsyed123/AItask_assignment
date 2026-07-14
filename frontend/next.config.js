/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Traces only the deps actually needed at runtime into .next/standalone -
  // lets the production Docker image skip shipping full node_modules.
  output: 'standalone',
};
module.exports = nextConfig;
