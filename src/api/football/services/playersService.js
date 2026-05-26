import { footballGet, extractResponse } from "../client.js";
import { LEAGUES, MOROCCO_NATIONALITY, PRIORITY_LEAGUE_IDS } from "../constants.js";
import { gamesFormatDate } from "../../../helpers/global.helper.js";
import { mapFixtures } from "../mappers/mapFixture.js";
import {
  mapSquadPlayers,
  mapTopPlayerRow,
  mapPlayerToTactic,
} from "../mappers/mapPlayer.js";

export async function getTeamSquad(teamId) {
  const data = await footballGet("players/squads", { team: teamId });
  const response = extractResponse(data);
  const rows = mapSquadPlayers(response);
  return { players: rows };
}

export async function getTeamSquadAsTactic(teamId) {
  const squad = await getTeamSquad(teamId);
  const players = (squad.players ?? [])
    .map((row) => mapPlayerToTactic(row.player))
    .filter(Boolean);
  return { players };
}

export async function getBotolaTopPlayers() {
  const { id, season } = LEAGUES.BOTOLA_PRO;

  try {
    const data = await footballGet("players/topscorers", {
      league: id,
      season,
    });
    const rows = extractResponse(data).map(mapTopPlayerRow);
    if (rows.length > 0) return rows;
  } catch {
    /* fallback below */
  }

  const data = await footballGet("players", { league: id, season, page: 1 });
  return extractResponse(data).map(mapTopPlayerRow);
}

function isMoroccanClub(countryName) {
  const c = (countryName ?? "").toLowerCase();
  return c === "morocco" || c === "maroc";
}

/**
 * Batch fetch for Internationaux tab — deduplicates squad requests.
 */
export async function getMoroccanPlayersForDate(date) {
  const dateStr = gamesFormatDate(date);
  const data = await footballGet("fixtures", {
    date: dateStr,
    timezone: "Africa/Casablanca",
  });
  const games = mapFixtures(extractResponse(data));

  const dateObj = date instanceof Date ? date : new Date(date);
  const isToday = (timestamp) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString() === dateObj.toLocaleDateString();
  };

  const prioritized = games.filter(
    (g) =>
      PRIORITY_LEAGUE_IDS.includes(g.league?.id) &&
      isToday(g.startTimestamp) &&
      !isMoroccanClub(g.homeTeam.country?.name) &&
      !isMoroccanClub(g.awayTeam.country?.name),
  );

  const teamIds = new Set();
  for (const g of prioritized) {
    teamIds.add(g.homeTeam.id);
    teamIds.add(g.awayTeam.id);
  }

  const squadsByTeamId = {};
  await Promise.all(
    [...teamIds].map(async (teamId) => {
      try {
        squadsByTeamId[teamId] = await getTeamSquad(teamId);
      } catch {
        squadsByTeamId[teamId] = { players: [] };
      }
    }),
  );

  const enrichedGames = prioritized.map((game) => {
    const homeSquad = squadsByTeamId[game.homeTeam.id]?.players ?? [];
    const awaySquad = squadsByTeamId[game.awayTeam.id]?.players ?? [];
    const moroccan = [...homeSquad, ...awaySquad].filter((row) => {
      const nat = row.player?.nationality ?? "";
      return nat === MOROCCO_NATIONALITY || nat.toLowerCase() === "morocco";
    });

    return {
      id: game.id,
      game,
      moroccanPlayers: moroccan,
    };
  });

  return enrichedGames.filter((e) => e.moroccanPlayers.length > 0);
}
