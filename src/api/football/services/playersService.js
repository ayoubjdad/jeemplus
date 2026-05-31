import { footballGet, extractResponse } from "../client.js";
import {
  LEAGUES,
  MOROCCO_NATIONALITY,
  MOROCCAN_PLAYERS_PRIORITY_LEAGUE_IDS,
  CURRENT_SEASON,
} from "../constants.js";
import { gamesFormatDate } from "../../../helpers/global.helper.js";
import { mapFixtures } from "../mappers/mapFixture.js";
import {
  mapPlayer,
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

function isMoroccanLeague(game) {
  const country = (game.league?.country ?? "").toLowerCase();
  return country === "morocco" || game.league?.id === LEAGUES.BOTOLA_PRO.id_v3;
}

function isMoroccanNationality(nationality) {
  const nat = (nationality ?? "").trim().toLowerCase();
  return nat === MOROCCO_NATIONALITY.toLowerCase() || nat === "morocco";
}

async function fetchMoroccanPlayersByTeam(teamId, season) {
  const moroccanPlayers = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await footballGet("players", { team: teamId, season, page });
    const rows = extractResponse(data);
    totalPages = data?.paging?.total ?? 1;

    for (const row of rows) {
      const player = row?.player;
      if (player && isMoroccanNationality(player.nationality)) {
        moroccanPlayers.push({ player: mapPlayer(player) });
      }
    }

    page += 1;
  }

  return moroccanPlayers;
}

async function fetchMoroccanPlayersForTeams(teamSeasonById) {
  const moroccanByTeamId = {};
  const teamIds = [...teamSeasonById.keys()];
  const concurrency = 4;

  for (let i = 0; i < teamIds.length; i += concurrency) {
    const chunk = teamIds.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (teamId) => {
        try {
          const season = teamSeasonById.get(teamId) ?? CURRENT_SEASON;
          moroccanByTeamId[teamId] = await fetchMoroccanPlayersByTeam(
            teamId,
            season,
          );
        } catch {
          moroccanByTeamId[teamId] = [];
        }
      }),
    );
  }

  return moroccanByTeamId;
}

/**
 * Batch fetch for Internationaux tab — deduplicates team roster requests.
 */
export async function getMoroccanPlayersForDate(date) {
  const dateStr = gamesFormatDate(date);
  const data = await footballGet("fixtures", {
    date: dateStr,
    timezone: "Africa/Casablanca",
  });
  const games = mapFixtures(extractResponse(data));

  const prioritized = games.filter(
    (g) =>
      MOROCCAN_PLAYERS_PRIORITY_LEAGUE_IDS.includes(g.league?.id) &&
      !isMoroccanLeague(g),
  );

  const teamSeasonById = new Map();
  for (const game of prioritized) {
    const season = Number(game.season?.name) || CURRENT_SEASON;
    teamSeasonById.set(game.homeTeam.id, season);
    teamSeasonById.set(game.awayTeam.id, season);
  }

  const moroccanByTeamId = await fetchMoroccanPlayersForTeams(teamSeasonById);

  const enrichedGames = prioritized.map((game) => {
    const homeMoroccans = moroccanByTeamId[game.homeTeam.id] ?? [];
    const awayMoroccans = moroccanByTeamId[game.awayTeam.id] ?? [];
    const moroccanPlayers = [...homeMoroccans, ...awayMoroccans];

    return {
      id: game.id,
      game,
      moroccanPlayers,
    };
  });

  return enrichedGames.filter((e) => e.moroccanPlayers.length > 0);
}
