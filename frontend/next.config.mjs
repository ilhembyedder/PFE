/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required by the multi-stage Dockerfile: emits a self-contained server.
  output: "standalone",

  // The previous config rewrote /dashboard/* and /admin/* onto the real
  // routes, which left those real routes reachable and completely unguarded
  // by the middleware matcher (CODE_REVIEW.md C5). The aliasing is gone and
  // these are now the only URLs.

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Tenant logos are arbitrary remote images, so img-src allows
            // https. Everything else is same-origin. 'unsafe-inline' is
            // required for the style attributes token variables are set on.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
