/**
 * Proxy /sofa-api/* → SofaScore JSON. SofaScore often returns 403 from Netlify/AWS IPs (TLS/WAF).
 * For football daily schedules we fall back to TheSportsDB (public key "3" or THESPORTSDB_KEY).
 */
import { spawn } from "node:child_process";
import { promisify } from "node:util";

const sleep = promisify(setTimeout);

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

const SCHEDULED_EVENTS_RE =
  /^sport\/football\/scheduled-events\/(\d{4}-\d{2}-\d{2})$/;

function parseSuffix(event) {
  const path = event.path ?? event.rawPath ?? "";
  let suffix = "";
  let search = "";

  const viaFn = path.match(/^\/\.netlify\/functions\/sofascore-fetch\/(.+)$/);
  if (viaFn) {
    suffix = viaFn[1];
  } else if (path.startsWith("/sofa-api/")) {
    suffix = path.slice("/sofa-api/".length);
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

function mapTheSportsDbStatus(ev) {
  const raw = ev.strStatus || "";
  const s = raw.toLowerCase();
  if (s.includes("finished")) {
    return { type: "finished", description: "Finished" };
  }
  if (s.includes("postponed")) {
    return { type: "notstarted", description: "Postponed" };
  }
  if (s.includes("not started") || s === "scheduled") {
    return { type: "notstarted", description: "Scheduled" };
  }
  /* e.g. First Half, HT, 2H, Live, In Play */
  if (raw.length > 0) {
    return { type: "inprogress", description: raw };
  }
  return { type: "notstarted", description: "Scheduled" };
}

function displayScore(v) {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

function mapTheSportsDbToSofaEvents(events) {
  return (events ?? []).map((ev) => {
    const homeId = Number.parseInt(ev.idHomeTeam, 10) || 0;
    const awayId = Number.parseInt(ev.idAwayTeam, 10) || 0;
    const leagueId = Number.parseInt(ev.idLeague, 10) || 0;
    const ts = ev.strTimestamp
      ? Math.floor(new Date(ev.strTimestamp).getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const status = mapTheSportsDbStatus(ev);
    return {
      id: Number.parseInt(ev.idEvent, 10) || 0,
      startTimestamp: ts,
      status,
      homeTeam: {
        id: homeId,
        name: ev.strHomeTeam,
        shortName: ev.strHomeTeam,
        country: { name: ev.strCountry || "" },
      },
      awayTeam: {
        id: awayId,
        name: ev.strAwayTeam,
        shortName: ev.strAwayTeam,
        country: { name: ev.strCountry || "" },
      },
      homeScore: { display: displayScore(ev.intHomeScore) },
      awayScore: { display: displayScore(ev.intAwayScore) },
      tournament: {
        uniqueTournament: {
          id: leagueId,
          name: ev.strLeague || "",
        },
      },
      roundInfo: {
        round: Number.parseInt(ev.intRound, 10) || 0,
      },
    };
  });
}

async function fetchTheSportsDbScheduled(date) {
  const key = process.env.THESPORTSDB_KEY || "3";
  const url = `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${encodeURIComponent(date)}&s=Soccer`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    return {
      status: res.status,
      body: JSON.stringify({
        error: "TheSportsDB fallback failed",
        status: res.status,
      }),
    };
  }
  const data = await res.json();
  const payload = { events: mapTheSportsDbToSofaEvents(data.events) };
  return {
    status: 200,
    body: JSON.stringify(payload),
  };
}

function curlGet(url) {
  return new Promise((resolve) => {
    const args = [
      "-sS",
      "-L",
      "--max-time",
      "25",
      "-H",
      `User-Agent: ${UPSTREAM_HEADERS["User-Agent"]}`,
      "-H",
      "Accept: application/json, text/plain, */*",
      "-H",
      "Accept-Language: en-US,en;q=0.9",
      "-H",
      "Referer: https://www.sofascore.com/",
      "-H",
      "Origin: https://www.sofascore.com",
      "-w",
      "\n%{http_code}",
      url,
    ];
    const p = spawn("curl", args, { stdio: ["ignore", "pipe", "pipe"] });
    const chunks = [];
    const err = [];
    p.stdout.on("data", (c) => chunks.push(c));
    p.stderr.on("data", (c) => err.push(c));
    p.on("error", () => {
      resolve({ ok: false, status: 0, bodyText: "", err: String(err) });
    });
    p.on("close", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      const idx = raw.lastIndexOf("\n");
      let bodyText = raw;
      let code = 0;
      if (idx !== -1) {
        const tail = raw.slice(idx + 1).trim();
        const n = Number.parseInt(tail, 10);
        if (!Number.isNaN(n)) {
          code = n;
          bodyText = raw.slice(0, idx);
        }
      }
      resolve({ ok: code >= 200 && code < 300, status: code, bodyText });
    });
  });
}

async function trySofaUpstream(suffix, search) {
  for (const base of UPSTREAM_BASES) {
    const url = `${base}/${suffix}${search}`;
    try {
      const res = await fetch(url, {
        headers: UPSTREAM_HEADERS,
        redirect: "follow",
      });
      if (res.status !== 403) {
        const body = await res.text();
        return {
          status: res.status,
          body,
          contentType:
            res.headers.get("content-type") || "application/json; charset=utf-8",
        };
      }
    } catch {
      /* try next */
    }
    await sleep(50);
  }

  for (const base of UPSTREAM_BASES) {
    const url = `${base}/${suffix}${search}`;
    const curled = await curlGet(url);
    if (curled.ok && curled.bodyText) {
      return {
        status: curled.status,
        body: curled.bodyText,
        contentType: "application/json",
      };
    }
    await sleep(50);
  }

  const bridge = process.env.SOFA_HTTP_BRIDGE?.replace(/\/$/, "");
  if (bridge) {
    try {
      const headers = { Accept: "application/json" };
      const secret = process.env.SOFA_BRIDGE_SECRET;
      if (secret) headers.Authorization = `Bearer ${secret}`;
      const r = await fetch(`${bridge}/${suffix}${search}`, { headers });
      if (r.status !== 403) {
        const body = await r.text();
        return {
          status: r.status,
          body,
          contentType:
            r.headers.get("content-type") || "application/json; charset=utf-8",
        };
      }
    } catch {
      /* fall through */
    }
  }

  return { status: 403, body: '{"error":{"code":403,"reason":"Forbidden"}}' };
}

function json(body, status, contentType = "application/json") {
  return {
    statusCode: status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60, s-maxage=120",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    return json('"Method Not Allowed"', 405);
  }

  const { suffix, search } = parseSuffix(event);

  if (!suffix) {
    return json(JSON.stringify({ error: "Missing path after /sofa-api/" }), 400);
  }

  const scheduledMatch = suffix.match(SCHEDULED_EVENTS_RE);
  const upstream = await trySofaUpstream(suffix, search);

  if (upstream.status === 403 && scheduledMatch) {
    const fb = await fetchTheSportsDbScheduled(scheduledMatch[1]);
    return json(fb.body, fb.status);
  }

  return json(
    upstream.body,
    upstream.status,
    upstream.contentType?.split(";")[0]?.trim() || "application/json",
  );
}
