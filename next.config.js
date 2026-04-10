/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Custom domain: admin.fridgenie.app
  // Set NEXT_PUBLIC_SITE_URL=https://admin.fridgenie.app in production
  // No basePath needed when using a custom domain (leave NEXT_PUBLIC_BASE_PATH empty)
};

module.exports = nextConfig;
