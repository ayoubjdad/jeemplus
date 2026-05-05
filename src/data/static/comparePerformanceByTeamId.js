import { botolaStandingsTables } from "./botolaStandings";

const rows = botolaStandingsTables[0]?.rows ?? [];

/** SofaScore-shaped `{ events: [...] }` — empty trends → UI shows "—". */
const emptyPerf = { events: [] };

/** @type {Record<number, { events: unknown[] }>} */
export const comparePerformanceByTeamId = Object.fromEntries(
  rows.map((r) => [r.team.id, emptyPerf])
);

/** @param {number | string | null | undefined} teamId */
export function getComparePerformance(teamId) {
  const id = Number(teamId);
  if (!Number.isFinite(id)) return emptyPerf;
  return comparePerformanceByTeamId[id] ?? emptyPerf;
}
