import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Photos are resized ahead of time by scripts/build-media.mjs and served as plain
      // files, so the site does not depend on an image-optimising server.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The raw Telegram export, kept as source material.
    "source/**",
  ]),
]);

export default eslintConfig;
