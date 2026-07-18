export const CLUB_PATH = "/clubedascolecionadoras";

const DEFAULT_PUBLIC_ORIGIN = "https://clube-das-colecionadoras.vercel.app";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePath(path = "") {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function getPublicOrigin() {
  const configuredOrigin =
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : DEFAULT_PUBLIC_ORIGIN);

  return trimTrailingSlash(configuredOrigin);
}

export function getClubUrl(path = "") {
  const configuredClubUrl = import.meta.env.VITE_PUBLIC_CLUBE_URL;
  const baseUrl = configuredClubUrl
    ? trimTrailingSlash(configuredClubUrl)
    : `${getPublicOrigin()}${CLUB_PATH}`;

  return `${baseUrl}${normalizePath(path)}`;
}

/**
 * Public visual files from the Clube deployment. They are intentionally served
 * from its own Vercel origin: this keeps the Clube independent from rewrites in
 * the main Lendo Sáficos project and preserves CORS for the story canvas.
 */
export function getClubAssetUrl(path: string) {
  const normalizedPath = normalizePath(path);
  const isLocal = typeof window !== "undefined" && (
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1" || 
    window.location.hostname.startsWith("192.168.")
  );
  const origin = isLocal ? window.location.origin : DEFAULT_PUBLIC_ORIGIN;
  return `${origin}${normalizedPath}`;
}

export function getPublicAlbumUrl(profileId: string) {
  return getClubUrl(`/album/u/${profileId}`);
}

export function getLoginUrl(search = "") {
  return getClubUrl(`/login${search}`);
}
