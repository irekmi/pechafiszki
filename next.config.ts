import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // `forbidden()` and its `app/forbidden.tsx` are the only App Router way to answer a rendered page
  // with HTTP 403, which DEC-57 and AC-03.4 require for an administration address opened by a User.
  experimental: { authInterrupts: true },
  // SQ-01.1: SCR-05 start is served at `/`; the old address stays a permanent redirect.
  redirects: async () => [{ source: "/start", destination: "/", permanent: true }],
};

export default nextConfig;
