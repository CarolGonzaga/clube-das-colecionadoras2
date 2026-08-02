export const CLUB_PATH = "/clubedascolecionadoras";

const DEFAULT_PUBLIC_ORIGIN = "https://clube-das-colecionadoras2.vercel.app";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePath(path = "") {
  if (!path) return "";
  const cleaned = path.replace(/^\/?public\//, "");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
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
 * Keep visual files on the same origin as the page whenever possible. This
 * avoids iOS privacy and content filters treating album covers as third-party
 * resources. During SSR, use the configured public origin.
 */
export function getClubAssetUrl(path: string) {
  const normalizedPath = normalizePath(path);
  if (import.meta.env.DEV) {
    return normalizedPath;
  }
  const configuredAssetOrigin =
    import.meta.env.VITE_PUBLIC_ASSET_ORIGIN ||
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_SITE_URL;
  const pageOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const assetOrigin =
    configuredAssetOrigin ||
    (pageOrigin.includes("lendosaficos.com.br") ? DEFAULT_PUBLIC_ORIGIN : pageOrigin) ||
    getPublicOrigin();
  return `${trimTrailingSlash(assetOrigin)}${normalizedPath}`;
}

export function getStickerCoverUrl(coverFilename: string) {
  const normalized = coverFilename.replace(/^\/+/, "");
  return getClubAssetUrl(normalized.includes("/") ? `/${normalized}` : `/covers/${normalized}`);
}

export function getPublicAlbumUrl(profileId: string) {
  return getClubUrl(`/album/u/${profileId}`);
}

export function getLoginUrl(search = "") {
  return getClubUrl(`/login${search}`);
}
