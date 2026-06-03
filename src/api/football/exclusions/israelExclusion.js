/** API-Football national team id for Israel. */
const ISRAEL_TEAM_IDS = new Set([1110]);

const ISRAEL_TEXT_RE = /\b(israel|israël|israeli)\b/i;
const ISRAEL_COUNTRY_CODES = new Set(["IL", "ISR"]);

function collectTeamText(team) {
  return [
    team?.name,
    team?.shortName,
    team?.fullName,
    team?.country?.name,
    team?.country?.code,
    typeof team?.country === "string" ? team.country : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * @param {Record<string, unknown> | null | undefined} team
 */
export function isIsraelTeam(team) {
  if (!team) return false;

  const id = Number(team.id);
  if (id && ISRAEL_TEAM_IDS.has(id)) return true;

  const alpha2 = String(team.country?.alpha2 ?? "").toUpperCase();
  if (alpha2 && ISRAEL_COUNTRY_CODES.has(alpha2)) return true;

  return ISRAEL_TEXT_RE.test(collectTeamText(team));
}

/**
 * @param {Record<string, unknown>} item - raw API-Football fixture item
 */
export function rawFixtureHasIsrael(item) {
  const teams = item?.teams ?? {};
  return isIsraelTeam(teams.home) || isIsraelTeam(teams.away);
}

/**
 * @param {ReturnType<import("../mappers/mapFixture.js").mapFixture>} fixture
 */
export function mappedFixtureHasIsrael(fixture) {
  return isIsraelTeam(fixture?.homeTeam) || isIsraelTeam(fixture?.awayTeam);
}
