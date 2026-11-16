import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// The addresses this computer has on its networks, such as 192.168.1.20. Opening the
// dev server from a phone uses one of them, and by default `next dev` refuses to serve
// its scripts to anything but localhost: the page then arrives with no script at all,
// so the menu does not open and nothing below the hero appears.
const ownAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((address) => address && address.family === "IPv4" && !address.internal)
  .map((address) => address!.address);

// GitHub Pages serves plain files, so the site is deployed there as a static export:
// `STATIC_EXPORT=1 next build` writes it to `out/`. A project's Pages site lives under
// the repository's name (nazacd.github.io/avenue-motors-web), which is the base path;
// the deploy workflow passes it in. Without these two the site builds and runs as an
// ordinary Next.js server, as it does locally.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

// Every page is generated ahead of time from the inventory file, so the request-time
// rendering features of the default scaffold are left off. That also lets an unknown
// address answer with a real 404.
const nextConfig: NextConfig = {
  // Only affects `next dev`.
  allowedDevOrigins: ownAddresses,
  basePath,
  ...(staticExport
    ? {
        output: "export" as const,
        // /ru/catalog becomes ru/catalog/index.html, which a file server finds with or
        // without the closing slash.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
