/**
 * JSON API base for SofaScore (axios/fetch).
 * Default `/sofa-api` is proxied by Vite (dev) and Netlify (prod) to https://www.sofascore.com/api/v1 — avoids browser CORS.
 * Set `VITE_SOFASCORE_API_BASE` to override (e.g. your own backend URL).
 */
export function getSofascoreApiV1Base() {
  const legacy = import.meta.env.VITE_SOFA_API_BASE;
  const primary = import.meta.env.VITE_SOFASCORE_API_BASE ?? legacy;
  const trimmed = primary?.replace(/\/$/, "");
  if (trimmed) return trimmed;
  return "/sofa-api";
}
