/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server runtime required for the admin API routes (service-role layer).
  // Static export is intentionally NOT used anymore.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
