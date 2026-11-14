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

// Every page is generated ahead of time from the inventory file, so the request-time
// rendering features of the default scaffold are left off. That also lets an unknown
// address answer with a real 404.
const nextConfig: NextConfig = {
  // Only affects `next dev`.
  allowedDevOrigins: ownAddresses,
};

export default nextConfig;
