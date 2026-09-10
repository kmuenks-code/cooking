/**
 * Static export. The whole site is prerendered to `out/` and served by GitHub
 * Pages, so there is no server at runtime: progress and the journal live in the
 * browser's localStorage (see lib/store.ts).
 *
 * On Pages the site is served from https://<user>.github.io/<repo>/, so it needs
 * a basePath. The deploy workflow sets NEXT_PUBLIC_BASE_PATH to /<repo>; local
 * `npm run dev` leaves it empty and serves from the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  // Pages serves directories, so every route needs its own index.html.
  // Caveat: sub-module ids contain a dot (found.mise-en-place), which Next
  // reads as a filename and so refuses to give a trailing slash. Those links
  // therefore go through a 301 and a full page load instead of a client-side
  // transition. Every page is prerendered, so it costs a round trip, not a
  // render — not worth mangling the id scheme to avoid.
  trailingSlash: true,
  // No image optimizer without a server.
  images: { unoptimized: true },
};

export default nextConfig;
