import { mapTeam } from "./mapTeam.js";

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
  };
}

/** @param {unknown[]} leagueStandings - first element of standings response */
export function mapStandingsTable(leagueStandings) {
  const rows = leagueStandings?.[0]?.league?.standings?.[0] ?? [];
  return rows.map(mapStandingRow);
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
    rows: (groupRows ?? []).map(mapStandingRow),
  }));
}
