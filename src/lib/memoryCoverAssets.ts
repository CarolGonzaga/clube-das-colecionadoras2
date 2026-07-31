const bundledCovers = import.meta.glob("../../public/covers-jogos/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const coverUrlByFilename = new Map(
  Object.entries(bundledCovers).map(([sourcePath, bundledUrl]) => {
    const filename = sourcePath.split("/").pop() || "";
    return [filename, bundledUrl];
  }),
);

export function getBundledMemoryCoverUrl(publicPath: string | undefined) {
  if (!publicPath) return null;
  const filename = publicPath.split(/[\\/]/).filter(Boolean).pop();
  return filename ? coverUrlByFilename.get(filename) || null : null;
}

export function getBundledMemoryCoverCount() {
  return coverUrlByFilename.size;
}
