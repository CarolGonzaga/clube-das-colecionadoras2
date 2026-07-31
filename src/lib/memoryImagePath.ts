export function normalizeMemoryCoverPath(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const withoutQuery = value.trim().split(/[?#]/, 1)[0];
  const filename = withoutQuery.split(/[\\/]/).filter(Boolean).pop();
  if (!filename || !/^[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(filename)) return null;
  return `/covers-jogos/${filename}`;
}
