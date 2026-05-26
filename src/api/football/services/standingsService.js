import { footballGet, extractResponse } from "../client.js";
import { LEAGUES } from "../constants.js";
import {
  mapStandingsTable,
  mapStandingsGroups,
} from "../mappers/mapStandingRow.js";

export async function getBotolaStandings() {
  const { id, season } = LEAGUES.BOTOLA_PRO;
  const data = await footballGet("standings", { league: id, season });
  const response = extractResponse(data);
  const rows = mapStandingsTable(response);
  return [{ type: "total", rows, name: "Botola Pro" }];
}

/** Same shape Ranking expects: standings array with rows */
export async function fetchBotolaStandingsTables() {
  return getBotolaStandings();
}

export async function getWorldCupGroups() {
  const { id, season } = LEAGUES.WORLD_CUP;
  const data = await footballGet("standings", { league: id, season });
  return mapStandingsGroups(extractResponse(data));
}
