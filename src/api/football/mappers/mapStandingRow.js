import { mapTeam } from "./mapTeam.js";
import { isIsraelTeam } from "../exclusions/israelExclusion.js";

function mapSideStats(side) {
  const goals = side?.goals ?? {};
  const scoresFor = goals.for ?? 0;
  const scoresAgainst = goals.against ?? 0;
  const diff = scoresFor - scoresAgainst;

  return {
    matches: side?.played ?? 0,
    wins: side?.win ?? 0,
    draws: side?.draw ?? 0,
    losses: side?.lose ?? 0,
    scoresFor,
    scoresAgainst,
    scoreDiffFormatted: diff > 0 ? `+${diff}` : String(diff),
    points: side?.points ?? 0,
  };
}

/**
 * @param {Record<string, unknown>} row - API standing row
 */
export function mapStandingRow(row) {
  const team = row?.team ?? {};
  const all = row?.all ?? {};
  const goals = all?.goals ?? {};

  const scoresFor = goals.for ?? 0;
  const scoresAgainst = goals.against ?? 0;
  const diff = row?.goalsDiff ?? scoresFor - scoresAgainst;

  return {
    id: row?.rank ?? team?.id,
    position: row?.rank ?? 0,
    matches: all?.played ?? 0,
    wins: all?.win ?? 0,
    draws: all?.draw ?? 0,
    losses: all?.lose ?? 0,
    scoresFor,
    scoresAgainst,
    scoreDiffFormatted: diff > 0 ? `+${diff}` : String(diff),
    points: row?.points ?? 0,
    team: mapTeam(team),
    promotion: row?.description ? { text: row.description } : null,
    qualification: row?.description ?? "—",
    form: row?.form ?? "",
    home: mapSideStats(row?.home),
    away: mapSideStats(row?.away),
  };
}

/** Pick stats slice for home / away / total standings views. */
export function applyStandingsFilter(row, filter) {
  if (filter === "home" && row.home) {
    return {
      ...row,
      matches: row.home.matches,
      wins: row.home.wins,
      draws: row.home.draws,
      losses: row.home.losses,
      scoresFor: row.home.scoresFor,
      scoresAgainst: row.home.scoresAgainst,
      scoreDiffFormatted: row.home.scoreDiffFormatted,
      points: row.home.points,
    };
  }
  if (filter === "away" && row.away) {
    return {
      ...row,
      matches: row.away.matches,
      wins: row.away.wins,
      draws: row.away.draws,
      losses: row.away.losses,
      scoresFor: row.away.scoresFor,
      scoresAgainst: row.away.scoresAgainst,
      scoreDiffFormatted: row.away.scoreDiffFormatted,
      points: row.away.points,
    };
  }
  return row;
}

/** @param {unknown[]} leagueStandings - first element of standings response */
export function mapStandingsTable(leagueStandings) {
  const rows = leagueStandings?.[0]?.league?.standings?.[0] ?? [];
  return rows.filter((row) => !isIsraelTeam(row?.team)).map(mapStandingRow);
}

/** World Cup / multi-group standings */
export function mapStandingsGroups(standingsResponse) {
  const item = standingsResponse?.[0];
  if (!item?.league?.standings) return [];

  const groups = item.league.standings;
  if (!Array.isArray(groups)) return [];

  return groups.map((groupRows, idx) => ({
    id: idx,
    type: "total",
    name: groupRows?.[0]?.group ?? `Groupe ${String.fromCharCode(65 + idx)}`,
    tournament: {
      groupName: groupRows?.[0]?.group ?? "",
      name: groupRows?.[0]?.group ?? "",
    },
    rows: (groupRows ?? [])
      .filter((row) => !isIsraelTeam(row?.team))
      .map(mapStandingRow),
  }));
}
