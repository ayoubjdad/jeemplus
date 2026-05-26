import axios from "axios";

const DEV = import.meta.env.DEV;

export function getFootballApiBase() {
  const trimmed = import.meta.env.VITE_FOOTBALL_API_BASE?.replace(/\/$/, "");
  return trimmed || "/football-api";
}

/**
 * @param {string} path - e.g. "fixtures" (no leading slash)
 * @param {Record<string, string | number | boolean | undefined>} [params]
 */
export async function footballGet(path, params = {}) {
  const base = getFootballApiBase();
  const cleanPath = path.replace(/^\//, "");
  const url = `${base}/${cleanPath}`;

  const query = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      query[k] = v;
    }
  }

  const response = await axios.get(url, { params: query });
  const data = response.data;

  if (DEV) {
    const remaining = response.headers?.["x-ratelimit-remaining"];
    if (remaining != null) {
      console.debug(`[API-Football] ${cleanPath} — quota remaining: ${remaining}`);
    }
  }

  if (data?.errors && Object.keys(data.errors).length > 0) {
    const msg = Object.values(data.errors).join("; ");
    throw new Error(msg || "API-Football error");
  }

  return data;
}

/** @returns {unknown[]} */
export function extractResponse(data) {
  return Array.isArray(data?.response) ? data.response : [];
}
