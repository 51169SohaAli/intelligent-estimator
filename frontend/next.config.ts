/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/:path*', // Redirects /api/... to NestJS on port 5000
      },
    ];
  },
};

module.exports = nextConfig;