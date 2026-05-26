import { footballGet, extractResponse } from "../client.js";
import { gamesFormatDate } from "../../../helpers/global.helper.js";
import { mapFixtures } from "../mappers/mapFixture.js";
import {
  LEAGUES,
  TOP_TEAM_NAMES,
  PRIORITY_LEAGUE_IDS,
} from "../constants.js";

function teamMatchesHighlight(teamName) {
  const n = (teamName ?? "").toLowerCase();
  return TOP_TEAM_NAMES.some((t) => n.includes(t.toLowerCase()));
}

export async function getFixturesByDate(date) {
  const dateStr = gamesFormatDate(date);
  const data = await footballGet("fixtures", { date: dateStr, timezone: "Africa/Casablanca" });
  return mapFixtures(extractResponse(data));
}

export function filterHighlightedGames(games, date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  const isSameDay = (timestamp) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString() === dateObj.toLocaleDateString();
  };

  const result = games.filter((game) => {
    const isTopTeam =
      teamMatchesHighlight(game.homeTeam.name) ||
      teamMatchesHighlight(game.awayTeam.name);
    const isBotola = game.league?.id === LEAGUES.BOTOLA_PRO.id;
    return (isTopTeam || isBotola) && isSameDay(game.startTimestamp);
  });

  if (result.length === 0) return games.slice(0, 10);

  return result.sort(
    (a, b) => (a.league?.id ?? 0) - (b.league?.id ?? 0),
  );
}

export function isPriorityLeague(leagueId) {
  return PRIORITY_LEAGUE_IDS.includes(leagueId);
}

export async function getFixtureById(fixtureId) {
  const data = await footballGet("fixtures", { id: fixtureId });
  const items = mapFixtures(extractResponse(data));
  return items[0] ?? null;
}
