import type { NextConfig } from "next";

// Every page is generated ahead of time from the inventory file, so the request-time
// rendering features of the default scaffold are left off. That also lets an unknown
// address answer with a real 404.
const nextConfig: NextConfig = {};

export default nextConfig;
