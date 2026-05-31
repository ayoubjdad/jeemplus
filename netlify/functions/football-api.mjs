/**
 * Proxy /football-api/* → API-Football v3.
 * API key stays server-side (API_FOOTBALL_KEY).
 */
const UPSTREAM = "https://v3.football.api-sports.io";

function parseSuffix(event) {
  const path = event.path ?? event.rawPath ?? "";
  let suffix = "";
  let search = "";

  const viaFn = path.match(/^\/\.netlify\/functions\/football-api\/(.+)$/);
  if (viaFn) {
    suffix = viaFn[1];
  } else if (path.startsWith("/football-api/")) {
    suffix = path.slice("/football-api/".length);
  } else {
    suffix = path.replace(/^\/+/, "");
  }

  const qIdx = suffix.indexOf("?");
  if (qIdx !== -1) {
    search = suffix.slice(qIdx);
    suffix = suffix.slice(0, qIdx);
  } else if (event.rawQuery) {
    search = `?${event.rawQuery}`;
  } else if (
    event.queryStringParameters &&
    Object.keys(event.queryStringParameters).length
  ) {
    search = `?${new URLSearchParams(event.queryStringParameters).toString()}`;
  }

  let dec = suffix.replace(/\/+$/, "");
  try {
    dec = decodeURIComponent(dec);
  } catch {
    /* keep raw */
  }
  return { suffix: dec, search };
}

function cacheControlForPath(suffix, search) {
  const path = suffix.toLowerCase();
  const qs = search.toLowerCase();

  if (path.includes("fixtures") && qs.includes("live")) {
    return "public, max-age=15, s-maxage=30";
  }
  if (
    path === "standings" ||
    path === "leagues" ||
    path.includes("players/squads") ||
    path.includes("teams/statistics")
  ) {
    return "public, max-age=300, s-maxage=900";
  }
  if (path === "fixtures" && qs.includes("date=")) {
    return "public, max-age=60, s-maxage=120";
  }
  if (
    path.includes("fixtures/statistics") ||
    path.includes("fixtures/events") ||
    path.includes("fixtures/lineups") ||
    (path === "fixtures" && qs.includes("id="))
  ) {
    return "public, max-age=30, s-maxage=60";
  }
  return "public, max-age=120, s-maxage=300";
}

function json(body, status, extraHeaders = {}) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      ...extraHeaders,
    },
    body,
  };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return json(JSON.stringify({ error: "Method Not Allowed" }), 405);
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return json(
      JSON.stringify({ error: "API_FOOTBALL_KEY is not configured" }),
      500,
    );
  }

  const { suffix, search } = parseSuffix(event);
  if (!suffix) {
    return json(JSON.stringify({ error: "Missing path after /football-api/" }), 400);
  }

  const url = `${UPSTREAM}/${suffix}${search}`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey,
        Accept: "application/json",
      },
      redirect: "follow",
    });

    const body = await res.text();
    const cache = cacheControlForPath(suffix, search);

    return json(body, res.status, {
      "Cache-Control": cache,
      "X-RateLimit-Remaining": res.headers.get("x-ratelimit-remaining") ?? "",
      "X-RateLimit-Requests-Limit":
        res.headers.get("x-ratelimit-requests-limit") ?? "",
    });
  } catch (err) {
    return json(
      JSON.stringify({
        error: "Upstream request failed",
        message: String(err?.message ?? err),
      }),
      502,
    );
  }
}
