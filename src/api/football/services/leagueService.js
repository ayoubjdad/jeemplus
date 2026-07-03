import { footballGet, extractResponse } from "../client.js";
import { CURRENT_SEASON } from "../constants.js";
import { mapFixtures } from "../mappers/mapFixture.js";
import { mapTopPlayerRow } from "../mappers/mapPlayer.js";
import { mapTeam } from "../mappers/mapTeam.js";
import { getLeagueStandings } from "./standingsService.js";
import { isIsraelTeam } from "../exclusions/israelExclusion.js";
import { LEAGUE_CATALOG, leagueLogoUrl } from "../leagueCatalog.js";

function mapPlayerWithCards(item) {
  const base = mapTopPlayerRow(item);
  const stats = item?.statistics?.[0] ?? item?.statistics ?? {};
  const cards = stats?.cards ?? {};
  const goals = stats?.goals ?? {};
  const games = stats?.games ?? {};

  const goalsTotal = goals.total ?? base.goals ?? 0;
  const assistsTotal = goals.assists ?? base.assists ?? 0;

  return {
    ...base,
    goals: goalsTotal,
    assists: assistsTotal,
    goalContributions: goalsTotal + assistsTotal,
    yellowCards: cards.yellow ?? 0,
    redCards: cards.red ?? 0,
    appearances: games.appearences ?? games.appearances ?? 0,
    rating: games.rating ?? base.rating ?? null,
  };
}

function mergePlayerRows(lists) {
  const byId = new Map();

  for (const list of lists) {
    for (const item of list) {
      const row = mapPlayerWithCards(item);
      const pid = row.player?.id;
      if (!pid || isIsraelTeam(row.team)) continue;

      const prev = byId.get(pid);
      if (!prev) {
        byId.set(pid, row);
        continue;
      }

      const goals = Math.max(prev.goals ?? 0, row.goals ?? 0);
      const assists = Math.max(prev.assists ?? 0, row.assists ?? 0);

      byId.set(pid, {
        ...prev,
        goals,
        assists,
        goalContributions: goals + assists,
        yellowCards: Math.max(prev.yellowCards ?? 0, row.yellowCards ?? 0),
        redCards: Math.max(prev.redCards ?? 0, row.redCards ?? 0),
        rating: prev.rating ?? row.rating,
        appearances: Math.max(prev.appearances ?? 0, row.appearances ?? 0),
        player: prev.player?.photo ? prev.player : row.player,
        team: prev.team?.logo ? prev.team : row.team,
      });
    }
  }

  return [...byId.values()];
}

async function fetchPlayerTopEndpoint(endpoint, leagueId, season) {
  try {
    const data = await footballGet(`players/${endpoint}`, {
      league: leagueId,
      season,
    });
    return extractResponse(data);
  } catch {
    return [];
  }
}

/** Resolve league metadata + available seasons from API-Football `/leagues`. */
export async function resolveLeagueContext(leagueId) {
  const id = Number(leagueId);
  if (!id) return null;

  const catalogFallback = LEAGUE_CATALOG.find((l) => l.id_v3 === id);

  try {
    const data = await footballGet("leagues", { id });
    const item = extractResponse(data)[0];

    if (item?.league) {
      const league = item.league;
      const country =
        typeof league.country === "string"
          ? league.country
          : (league.country?.name ?? catalogFallback?.country ?? "");

      const seasons = [...(item.seasons ?? [])]
        .map((s) => s.year)
        .filter(Boolean)
        .sort((a, b) => b - a);

      const defaultSeason =
        seasons.find((y) => y === CURRENT_SEASON) ??
        seasons[0] ??
        catalogFallback?.season ??
        CURRENT_SEASON;

      return {
        id,
        name: league.name ?? catalogFallback?.name ?? "",
        country,
        logo: league.logo ?? leagueLogoUrl(id),
        seasons: seasons.length
          ? seasons
          : [catalogFallback?.season ?? CURRENT_SEASON],
        season: defaultSeason,
      };
    }
  } catch {
    /* fallback below */
  }

  if (catalogFallback) {
    return {
      id,
      name: catalogFallback.name,
      country: catalogFallback.country,
      logo: leagueLogoUrl(id),
      seasons: [catalogFallback.season],
      season: catalogFallback.season,
    };
  }

  return null;
}

export async function getLeagueFixtures(leagueId, season) {
  const data = await footballGet("fixtures", { league: leagueId, season });
  return mapFixtures(extractResponse(data)).sort(
    (a, b) => (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0),
  );
}

export async function getLeagueRounds(leagueId, season) {
  try {
    const data = await footballGet("fixtures/rounds", { league: leagueId, season });
    return extractResponse(data).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Player leaders from API-Football:
 * topscorers, topassists, topyellowcards, topredcards
 */
export async function getLeaguePlayerStats(leagueId, season) {
  const [scorers, assists, yellows, reds] = await Promise.all([
    fetchPlayerTopEndpoint("topscorers", leagueId, season),
    fetchPlayerTopEndpoint("topassists", leagueId, season),
    fetchPlayerTopEndpoint("topyellowcards", leagueId, season),
    fetchPlayerTopEndpoint("topredcards", leagueId, season),
  ]);

  const merged = mergePlayerRows([scorers, assists, yellows, reds]);
  if (merged.length > 0) return merged;

  try {
    const data = await footballGet("players", { league: leagueId, season, page: 1 });
    return extractResponse(data)
      .map(mapPlayerWithCards)
      .filter((row) => !isIsraelTeam(row.team));
  } catch {
    return [];
  }
}

/** @deprecated use getLeaguePlayerStats */
export async function getLeagueTopPlayers(leagueId, season) {
  return getLeaguePlayerStats(leagueId, season);
}

export async function getLeagueTeamStats(teamIds, leagueId, season) {
  const results = [];
  const concurrency = 4;

  for (let i = 0; i < teamIds.length; i += concurrency) {
    const chunk = teamIds.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (teamId) => {
        try {
          const data = await footballGet("teams/statistics", {
            team: teamId,
            league: leagueId,
            season,
          });
          const item = extractResponse(data)[0];
          const team = mapTeam(item?.team ?? {});
          if (isIsraelTeam(team)) return null;

          const played = item?.fixtures?.played?.total ?? 1;
          const goalsFor =
            item?.goals?.for?.total?.total ?? item?.goals?.for?.total ?? 0;
          const goalsAgainst =
            item?.goals?.against?.total?.total ??
            item?.goals?.against?.total ??
            0;

          return {
            id: team.id,
            team,
            goalsPerMatch: goalsFor / played,
            concededPerMatch: goalsAgainst / played,
            cleanSheets: item?.clean_sheet?.total ?? null,
            yellowCards: item?.cards?.yellow?.total ?? 0,
            redCards: item?.cards?.red?.total ?? 0,
          };
        } catch {
          return null;
        }
      }),
    );
    results.push(...chunkResults.filter(Boolean));
  }

  return results;
}

/** Parallel bundle used by the league dashboard. */
export async function getLeagueDashboardData(leagueId, season) {
  const [context, standings, fixtures, players, rounds] = await Promise.all([
    resolveLeagueContext(leagueId),
    getLeagueStandings(leagueId, season),
    getLeagueFixtures(leagueId, season),
    getLeaguePlayerStats(leagueId, season),
    getLeagueRounds(leagueId, season),
  ]);

  return {
    context,
    standings,
    fixtures,
    players,
    rounds,
  };
}

export { getLeagueStandings };
