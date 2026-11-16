// Where the site's own files are served from. Empty when the site has an address to
// itself; on GitHub Pages it is the repository's name ("/avenue-motors-web"), because a
// project's site lives in a folder of the account's address. Links made with next/link
// get it added for them. Plain addresses of pictures, films and models do not, so they
// pass through here.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const OWN = /^\/(media|models)\//;

export const asset = (path: string) => `${basePath}${path}`;

// A full address, for the places that are read outside the site itself: the picture a
// messenger shows beside a link has to say where it lives. Takes a path that already
// carries the base path.
export const absolute = (path: string) => new URL(path, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").href;

// The same for a whole list of files, such as the media manifest: every address in it
// that points into the site's own folders gets the base path.
export function withBase<T>(value: T): T {
  if (!basePath) return value;
  if (typeof value === "string") return (OWN.test(value) ? asset(value) : value) as T;
  if (Array.isArray(value)) return value.map(withBase) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, withBase(entry)])) as T;
  }
  return value;
}
