/**
 * Resolves a local asset path (e.g. "/assets/..." or "/src/assets/...") against
 * Vite's configured `import.meta.env.BASE_URL` so images work both locally and
 * under GitHub Pages subpaths like "/PAHANPIYASA-CEYLON-CAFE/".
 */
export function resolveAssetUrl(src: string): string {
  if (!src) return src;
  if (/^(https?:|data:|blob:|\/\/)/i.test(src)) {
    return src;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (normalizedBase !== '/' && src.startsWith(normalizedBase)) {
    return src;
  }
  if (src.startsWith('/')) {
    return `${normalizedBase}${src.slice(1)}`;
  }
  return `${normalizedBase}${src}`;
}
