/**
 * SofaScore blocks many datacenter TLS fingerprints (403). Node Lambdas often fail.
 * Edge (Deno fetch) sometimes succeeds; if not, set Netlify env SOFA_HTTP_BRIDGE to your own backend proxy.
 */

const UPSTREAM_BASES = [
  "https://www.sofascore.com/api/v1",
  "https://api.sofascore.app/api/v1",
];

const UPSTREAM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
};

/** @param {Request} request */
export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const suffix = url.pathname
    .replace(/^\/sofa-api\/?/, "")
    .replace(/^\/+/, "");

  if (!suffix) {
    return new Response(
      JSON.stringify({ error: "Missing path after /sofa-api/" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const search = url.search || "";

  /** @type {Response | null} */
  let res = null;

  for (const base of UPSTREAM_BASES) {
    res = await fetch(`${base}/${suffix}${search}`, {
      headers: UPSTREAM_HEADERS,
    });
    if (res.status !== 403) break;
  }

  const bridge = Deno.env.get("SOFA_HTTP_BRIDGE")?.replace(/\/$/, "");
  if (bridge && res && res.status === 403) {
    const secret = Deno.env.get("SOFA_BRIDGE_SECRET");
    const headers = { Accept: "application/json" };
    if (secret) headers.Authorization = `Bearer ${secret}`;
    res = await fetch(`${bridge}/${suffix}${search}`, { headers });
  }

  if (!res) {
    return new Response(
      JSON.stringify({ error: "No upstream response" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const ct =
    res.headers.get("content-type") || "application/json; charset=utf-8";

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=60, s-maxage=120",
    },
  });
};
