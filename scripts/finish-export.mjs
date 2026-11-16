// The last step of the static export for GitHub Pages (`npm run build:pages`).
//
// On a server, a visitor who arrives without a language in the address is sent on by
// src/proxy.ts, and an unknown address gets the site's "not found" screen. A static
// host runs no code, so both are done by two small pages written here:
//   out/index.html  sends the visitor to the home page in their browser's language
//   out/404.html    which GitHub Pages shows for any unknown address; it sends the
//                   visitor to the "not found" screen in the address's own language
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// The site's languages, read out of its own list.
const config = readFileSync("src/i18n/config.ts", "utf8");
const locales = [...config.match(/export const locales = \[(.*?)\]/)[1].matchAll(/"(\w+)"/g)].map((found) => found[1]);
const defaultLocale = config.match(/export const defaultLocale[^=]*= "(\w+)"/)[1];

const out = "out";
if (!existsSync(out)) throw new Error("There is no out/ folder: run the export build first.");

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Picks the language: the one in the address if there is one, or else the first of the
// browser's languages that the site has, or else the default.
const pick = `
var base = ${JSON.stringify(base)}, known = ${JSON.stringify(locales)}, lang = "";
var first = location.pathname.slice(base.length).split("/")[1] || "";
if (known.indexOf(first) > -1) lang = first;
var asked = navigator.languages || [navigator.language || ""];
for (var i = 0; !lang && i < asked.length; i++) {
  var code = String(asked[i]).toLowerCase().split("-")[0];
  if (known.indexOf(code) > -1) lang = code;
}
lang = lang || ${JSON.stringify(defaultLocale)};`;

// The root link gets shared too, and a messenger's preview robot runs no script, so it
// would never follow the redirect. The root page therefore carries the same title,
// description and picture as the home page in the default language.
const home = readFileSync(`${out}/${defaultLocale}/index.html`, "utf8");
const title = home.match(/<title>[^<]*<\/title>/)?.[0] ?? "<title>Avenue Motors</title>";
const preview = (home.match(/<meta (?:property="og:|name="twitter:|name="description")[^>]*>/g) ?? []).join("\n");

const page = ({ script, fallback, head = "<title>Avenue Motors</title>" }) => `<!doctype html>
<html lang="${defaultLocale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
${head}
<style>html{background:#050506;color:#f2f0ea;font:16px/1.5 system-ui,sans-serif}body{margin:0;min-height:100vh;display:grid;place-items:center}a{color:#ffcc00}</style>
<script>(function(){${pick}${script}})()</script>
<noscript><meta http-equiv="refresh" content="0; url=${fallback}"></noscript>
</head>
<body><a href="${fallback}">Avenue Motors</a></body>
</html>
`;

writeFileSync(
  `${out}/index.html`,
  page({
    script: `location.replace(base + "/" + lang + "/" + location.search + location.hash);`,
    fallback: `${base}/${defaultLocale}/`,
    head: `${title}\n${preview}`,
  }),
);

writeFileSync(
  `${out}/404.html`,
  page({
    // Already on the "not found" screen means it is missing too: stay, rather than loop.
    script: `if (!/\\/404\\/?$/.test(location.pathname)) location.replace(base + "/" + lang + "/404/");`,
    fallback: `${base}/${defaultLocale}/404/`,
  }),
);

// Tells GitHub Pages to serve the folder as it is; without it, folders whose names
// start with an underscore (Next's own _next) can be left out.
writeFileSync(`${out}/.nojekyll`, "");

console.log(`Wrote ${out}/index.html, ${out}/404.html and ${out}/.nojekyll (base path: "${base}")`);
