import { footballGet, extractResponse } from "../client.js";
import { LEAGUES } from "../constants.js";
import { isIsraelTeam } from "../exclusions/israelExclusion.js";
import {
  mapStandingRow,
  mapStandingsTable,
} from "../mappers/mapStandingRow.js";

export async function getBotolaStandings() {
  const { id_v3, season } = LEAGUES.BOTOLA_PRO;
  const data = await footballGet("standings", { league: id_v3, season });
  const response = extractResponse(data);
  const rows = mapStandingsTable(response);
  return [{ type: "total", rows, name: "Botola Pro" }];
}

/** Same shape Ranking expects: standings array with rows */
export async function fetchBotolaStandingsTables() {
  return getBotolaStandings();
}

/** Standings for a single league (domestic table or first group for tournaments). */
export async function getLeagueStandings(leagueId, season) {
  const data = await footballGet("standings", { league: leagueId, season });
  const response = extractResponse(data);
  const item = response?.[0];
  const league = item?.league ?? {};
  const standings = league.standings;

  if (Array.isArray(standings) && standings.length > 1) {
    const groupRows = standings[0] ?? [];
    return {
      leagueName: league.name ?? "",
      country: league.country ?? "",
      groupName: groupRows[0]?.group ?? null,
      rows: groupRows
        .filter((row) => !isIsraelTeam(row?.team))
        .map(mapStandingRow),
    };
  }

  return {
    leagueName: league.name ?? "",
    country: league.country ?? "",
    groupName: null,
    rows: mapStandingsTable(response),
  };
}
