/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output → runs in a minimal Docker image (node .next/standalone/server.js)
  output: 'standalone',
};

export default nextConfig;
