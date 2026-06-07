import { LEAGUES, TOP_TEAM_NAMES } from "../api/football/constants";

function teamMatchesHighlight(teamName) {
  const n = (teamName ?? "").toLowerCase();
  return TOP_TEAM_NAMES.some((t) => n.includes(t.alias.toLowerCase()));
}

function isTopTeamGame(game) {
  return (
    teamMatchesHighlight(game?.homeTeam?.name) ||
    teamMatchesHighlight(game?.awayTeam?.name)
  );
}

function getCompetitionSortPriority(game) {
  if (game?.league?.id === LEAGUES.BOTOLA_PRO.id_v3) return 0;
  if (isTopTeamGame(game)) return 1;
  return 2;
}

function competitionLabel(game) {
  return (
    game?.league?.name ??
    game?.tournament?.uniqueTournament?.name ??
    "—"
  );
}

function competitionCountry(game) {
  const country = game?.league?.country;
  if (typeof country === "string") return country;
  return country?.name ?? game?.tournament?.category?.name ?? "";
}

/**
 * Groups fixtures (or enriched rows) by league/competition.
 * @param {unknown[]} items
 * @param {(item: unknown) => object} getGame
 */
export function groupGamesByCompetition(items, getGame = (item) => item) {
  const groupsMap = new Map();

  for (const item of items) {
    const game = getGame(item);
    if (!game) continue;

    const leagueId = game?.league?.id ?? 0;
    const key = leagueId || competitionLabel(game);

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key: String(key),
        id: leagueId,
        name: competitionLabel(game),
        logo: game?.league?.logo ?? "",
        country: competitionCountry(game),
        items: [],
      });
    }

    groupsMap.get(key).items.push(item);
  }

  const groups = [...groupsMap.values()];

  for (const group of groups) {
    group.items.sort((a, b) => {
      const ga = getGame(a);
      const gb = getGame(b);
      return (ga?.startTimestamp ?? 0) - (gb?.startTimestamp ?? 0);
    });
  }

  groups.sort((a, b) => {
    const sampleA = getGame(a.items[0]);
    const sampleB = getGame(b.items[0]);
    const priorityDiff =
      getCompetitionSortPriority(sampleA) - getCompetitionSortPriority(sampleB);
    if (priorityDiff !== 0) return priorityDiff;
    return (a.id ?? 0) - (b.id ?? 0);
  });

  return groups;
}
