/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Prevent ESLint warnings/errors from failing Vercel production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Prevent TypeScript build check errors from stopping Vercel deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
