/**
 * Server-side proxy for SofaScore JSON API.
 * Netlify’s plain rewrite to sofascore.com often gets 403; this adds browser-like headers.
 */

function suffixFromPath(pathname) {
  if (!pathname) return "";
  const byFn = pathname.match(/\/sofa-proxy\/(.+)$/);
  if (byFn) return byFn[1];
  const byLegacy = pathname.match(/\/sofa-api\/(.+)$/);
  if (byLegacy) return byLegacy[1];
  return "";
}

function buildQuery(event) {
  if (event.rawQuery) return event.rawQuery;
  const q = event.queryStringParameters;
  if (!q || typeof q !== "object") return "";
  return new URLSearchParams(q).toString();
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let pathname = event.path || "";
  try {
    if (event.rawUrl) {
      pathname = new URL(event.rawUrl).pathname;
    }
  } catch {
    /* keep event.path */
  }

  let suffix = suffixFromPath(pathname);
  if (!suffix && event.headers?.["x-netlify-original-pathname"]) {
    suffix = suffixFromPath(event.headers["x-netlify-original-pathname"]);
  }

  const qs = buildQuery(event);
  const queryPart = qs ? `?${qs}` : "";

  if (!suffix) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing API path after /sofa-api/" }),
    };
  }

  const target = `https://www.sofascore.com/api/v1/${suffix}${queryPart}`;

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.sofascore.com/",
        Origin: "https://www.sofascore.com",
      },
    });

    const body = await res.text();
    const contentType =
      res.headers.get("content-type") || "application/json; charset=utf-8";

    return {
      statusCode: res.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60, s-maxage=120",
      },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Upstream fetch failed",
        message: String(err?.message ?? err),
      }),
    };
  }
};
