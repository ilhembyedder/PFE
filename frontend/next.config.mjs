/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: '/cases',
      },
      {
        source: '/dashboard/:path*',
        destination: '/:path*',
      },
      {
        source: '/admin',
        destination: '/tenants',
      },
      {
        source: '/admin/:path*',
        destination: '/:path*',
      },
    ];
  },
};

export default nextConfig;
