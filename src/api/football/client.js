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

  try {
    const response = await axios.get(url, { params: query });
    const data = response.data;

    if (DEV) {
      const remaining = response.headers?.["x-ratelimit-remaining"];
      if (remaining != null) {
        console.debug(
          `[API-Football] ${cleanPath} — quota remaining: ${remaining}`,
        );
      }
    }

    if (data?.errors && Object.keys(data.errors).length > 0) {
      const msg = Object.values(data.errors).filter(Boolean).join("; ");
      throw new Error(msg || "API-Football error");
    }

    return data;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 403) {
      throw new Error(
        "API-Football refused the request (403). Check API_FOOTBALL_KEY in Netlify environment variables.",
      );
    }
    if (status === 429) {
      throw new Error("API-Football daily quota exceeded. Try again tomorrow.");
    }
    const apiMsg = err?.response?.data?.message;
    if (apiMsg) throw new Error(apiMsg);
    throw err;
  }
}

/** @returns {unknown[]} */
export function extractResponse(data) {
  return Array.isArray(data?.response) ? data.response : [];
}
