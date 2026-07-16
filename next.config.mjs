/**
 * Two build modes:
 *  - Default (server): normal Next.js with the /api/translate route. Used for
 *    local dev and any server host (Vercel, Cloud Run, …).
 *  - Static (BUILD_TARGET=pages): a fully static export for GitHub Pages, where
 *    translation runs client-side against MyMemory. basePath is set to the repo
 *    name so project pages (username.github.io/repo) resolve correctly.
 */
const isPages = process.env.BUILD_TARGET === "pages";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isPages
    ? {
        output: "export",
        images: { unoptimized: true },
        basePath,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
