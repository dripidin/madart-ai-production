export const ADMIN_BASE_PATH = "/admin";

/**
 * Prefixes local admin-dashboard public asset paths with `/admin`
 * so static exports and dev servers resolve them under Next.js `basePath`.
 */
export function adminAssetPath(path: string): string {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith(`${ADMIN_BASE_PATH}/`) || path === ADMIN_BASE_PATH) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ADMIN_BASE_PATH}${normalized}`;
}
