import { footballGet, extractResponse } from "../client.js";
import { gamesFormatDate } from "../../../helpers/global.helper.js";
import { mapFixtures } from "../mappers/mapFixture.js";
import { LEAGUES, TOP_TEAM_NAMES, PRIORITY_LEAGUE_IDS } from "../constants.js";
import { mappedFixtureHasIsrael } from "../exclusions/israelExclusion.js";

function teamMatchesHighlight(teamName) {
  const n = (teamName ?? "").toLowerCase();
  return TOP_TEAM_NAMES.some((t) => n.includes(t.alias.toLowerCase()));
}

function isTopTeamGame(game) {
  return (
    teamMatchesHighlight(game.homeTeam.name) ||
    teamMatchesHighlight(game.awayTeam.name)
  );
}

export function isHighlightedFixture(game) {
  if (mappedFixtureHasIsrael(game)) return false;

  const leagueId = Number(game.league?.id);
  if (PRIORITY_LEAGUE_IDS.includes(leagueId)) return true;

  return isTopTeamGame(game);
}

function getGameSortPriority(game) {
  if (game.league?.id === LEAGUES.BOTOLA_PRO.id_v3) return 0;
  if (isTopTeamGame(game)) return 1;
  return 2;
}

function sortHighlightedGames(games) {
  return [...games].sort((a, b) => {
    const priorityDiff = getGameSortPriority(a) - getGameSortPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.league?.id ?? 0) - (b.league?.id ?? 0);
  });
}

export async function getFixturesByDate(date) {
  const dateStr = gamesFormatDate(date);
  const data = await footballGet("fixtures", {
    date: dateStr,
    timezone: "Africa/Casablanca",
  });
  return mapFixtures(extractResponse(data));
}

export function filterHighlightedGames(games) {
  const withoutIsrael = games.filter((game) => !mappedFixtureHasIsrael(game));
  const result = sortHighlightedGames(
    withoutIsrael.filter(isHighlightedFixture),
  );

  if (result.length === 0)
    return sortHighlightedGames(withoutIsrael.slice(0, 10));

  return result;
}

/** Split fixtures into curated highlighted set vs everything else. */
export function partitionHighlightedGames(games) {
  const withoutIsrael = games.filter((game) => !mappedFixtureHasIsrael(game));
  const highlighted = sortHighlightedGames(
    withoutIsrael.filter(isHighlightedFixture),
  );
  const highlightedIds = new Set(highlighted.map((g) => g.id));
  const rest = withoutIsrael.filter((g) => !highlightedIds.has(g.id));

  return { highlighted, rest };
}

export function isPriorityLeague(leagueId) {
  return PRIORITY_LEAGUE_IDS.includes(leagueId);
}

export async function getFixtureById(fixtureId) {
  const data = await footballGet("fixtures", { id: fixtureId });
  const items = mapFixtures(extractResponse(data));
  return items[0] ?? null;
}
