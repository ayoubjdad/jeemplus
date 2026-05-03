import axios from "axios";
import { getSofascoreApiV1Base } from "../../api/sofascoreBase";

/** Al-Nassr (example from SofaScore) — override via Fanbase / props */
export const DEFAULT_SOFA_TEAM_ID = 23400;

/**
 * Uses `/sofa-api` by default (Vite dev + Netlify proxy → sofascore.com/api/v1).
 * Override with `VITE_SOFASCORE_API_BASE` or `VITE_SOFA_API_BASE`.
 */
export function getSofaApiV1Base() {
  return getSofascoreApiV1Base();
}

/**
 * @typedef {{ value?: number, currency?: string }} MarketRaw
 * @typedef {{ id: number, name?: string, shortName?: string, shirtNumber?: number, jerseyNumber?: string, position?: string, positionsDetailed?: string[], proposedMarketValueRaw?: MarketRaw }} SofaPlayer
 * @typedef {{ player: SofaPlayer }} SofaPlayerRow
 * @typedef {{ players: SofaPlayerRow[] }} SofaTeamPlayersResponse
 * @typedef {{ id: string, sofaPlayerId: number, name: string, shortName: string, number: number, role: string, positionGroup: string, captain: boolean, rating: number, ratingColor: "green"|"orange"|"cyan" }} TacticPlayer
 */

/**
 * SofaScore roster payload: `{ players: [{ player: { ... } }], foreignPlayers, ... }`
 * @param {unknown} data
 * @returns {SofaTeamPlayersResponse}
 */
export function normalizeTeamPlayersPayload(data) {
  if (!data || typeof data !== "object") return { players: [] };
  const rows = Array.isArray(data.players) ? data.players : [];
  return { players: rows };
}

/**
 * Display rating + color (Squad API has no match rating — derived from market value for UI only).
 * @param {MarketRaw | undefined} raw
 */
function ratingFromMarketValue(raw) {
  const v = raw?.value;
  if (v == null || Number.isNaN(v)) {
    return { rating: 7.0, ratingColor: "green" };
  }
  if (v >= 22_000_000) return { rating: 8.5, ratingColor: "cyan" };
  if (v >= 12_000_000) return { rating: 8.2, ratingColor: "cyan" };
  if (v >= 6_000_000) return { rating: 7.8, ratingColor: "green" };
  if (v >= 2_000_000) return { rating: 7.4, ratingColor: "green" };
  if (v >= 500_000) return { rating: 7.0, ratingColor: "green" };
  if (v >= 150_000) return { rating: 6.7, ratingColor: "orange" };
  return { rating: 6.5, ratingColor: "orange" };
}

const POSITION_RANK = { G: 0, GK: 0, D: 1, DC: 1, DL: 1, DR: 1, M: 2, F: 3 };

function sortRank(p) {
  const coarse = p.positionGroup;
  const r = POSITION_RANK[coarse] ?? 9;
  return r * 1000 + (p.number || 0);
}

/**
 * @param {SofaPlayerRow} row
 * @returns {TacticPlayer | null}
 */
export function mapSofaPlayerRowToTactic(row) {
  const p = row?.player;
  if (!p || typeof p.id !== "number") return null;

  const number =
    typeof p.shirtNumber === "number" && !Number.isNaN(p.shirtNumber)
      ? p.shirtNumber
      : parseInt(String(p.jerseyNumber ?? "0"), 10) || 0;

  const role =
    (Array.isArray(p.positionsDetailed) && p.positionsDetailed[0]) ||
    p.position ||
    "?";

  const positionGroup = typeof p.position === "string" ? p.position : "?";
  const { rating, ratingColor } = ratingFromMarketValue(
    p.proposedMarketValueRaw
  );
  const displayRating = Math.round(rating * 10) / 10;

  return {
    id: String(p.id),
    sofaPlayerId: p.id,
    name: p.name || p.shortName || "—",
    shortName: p.shortName || p.name || "—",
    number,
    role,
    positionGroup,
    captain: false,
    rating: displayRating,
    ratingColor,
  };
}

/**
 * @param {SofaPlayerRow[]} rows
 * @returns {TacticPlayer[]}
 */
export function mapAndSortRoster(rows) {
  const list = rows.map(mapSofaPlayerRowToTactic).filter(Boolean);
  list.sort((a, b) => sortRank(a) - sortRank(b));
  return list;
}

/**
 * @param {number | string} teamId
 * @returns {Promise<TacticPlayer[]>}
 */
export async function fetchTeamPlayersRoster(teamId) {
  const base = getSofaApiV1Base();
  const { data } = await axios.get(`${base}/team/${teamId}/players`, {
    timeout: 25_000,
  });
  const { players } = normalizeTeamPlayersPayload(data);
  return mapAndSortRoster(players);
}
