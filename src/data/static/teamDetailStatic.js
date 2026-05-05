import { botolaStandingsTables } from "./botolaStandings";

/** @param {Record<string, unknown>} row Botola standings row from snapshot */
function statsFromStandingRow(row) {
  const m = typeof row.matches === "number" ? row.matches : 18;
  const gf = typeof row.scoresFor === "number" ? row.scoresFor : 0;
  const ga = typeof row.scoresAgainst === "number" ? row.scoresAgainst : 0;
  return {
    id: "snapshot-overall",
    matches: m,
    goalsScored: gf,
    goalsConceded: ga,
    assists: Math.max(1, Math.round(gf * 0.55)),
    penaltyGoals: Math.max(0, Math.round(gf * 0.08)),
    penaltiesTaken: Math.max(0, Math.round(gf * 0.12)),
    shots: m * 11,
    shotsAgainst: m * 10,
    errorsLeadingToShot: Math.max(0, Math.round(m * 0.35)),
    successfulDribbles: m * 9,
    dribbleAttempts: m * 16,
    corners: m * 5,
    offsides: m * 2,
    accuratePasses: m * 340,
    accuratePassesPercentage: 81,
    accurateLongBalls: m * 28,
    accurateLongBallsPercentage: 62,
    accurateCrosses: m * 9,
    accurateCrossesPercentage: 29,
    totalPasses: m * 410,
    totalLongBalls: m * 42,
    totalCrosses: m * 28,
    freeKicks: m * 14,
    averageBallPossession: 52,
    cleanSheets: Math.max(0, Math.round(m * 0.28)),
    saves: m * 3,
    goalKicks: m * 9,
    ballRecovery: m * 52,
    interceptions: m * 38,
    duelsWon: m * 46,
    duelsWonPercentage: 52,
    aerialDuelsWon: m * 19,
    aerialDuelsWonPercentage: 49,
    fouls: m * 11,
    yellowCards: m * 2,
    redCards: Math.max(0, Math.round(m * 0.08)),
    yellowRedCards: 0,
    awardedMatches: 0,
  };
}

/**
 * @param {number | string | null | undefined} teamId
 * @returns {{
 *   data: Record<string, unknown>,
 *   performanceData: { events: unknown[] },
 *   uniqueTournamentsData: { uniqueTournaments: unknown[] },
 *   overallStatsData: { statistics: Record<string, unknown> },
 * } | null}
 */
export function getTeamDetailParts(teamId) {
  const id = Number(teamId);
  if (!Number.isFinite(id)) return null;
  const rows = botolaStandingsTables[0]?.rows ?? [];
  const row = rows.find((r) => r.team?.id === id);
  if (!row?.team) return null;

  const t = row.team;

  const data = {
    team: {
      ...t,
      fullName: t.name,
      slug: t.slug ?? "",
      venue: { name: "Stade (données statiques)" },
      primaryUniqueTournament: {
        id: 937,
        name: "Botola Pro",
        fieldTranslations: {
          nameTranslation: { fr: "Botola Pro", ar: "البطولة الاحترافية" },
        },
      },
      manager: null,
    },
    pregameForm: {
      form: ["W", "D", "W", "L", "W"],
      avgRating: "7.05",
    },
  };

  return {
    data,
    performanceData: { events: [] },
    uniqueTournamentsData: {
      uniqueTournaments: [
        {
          uniqueTournament: {
            id: 937,
            name: "Botola Pro",
            slug: "botola-pro",
          },
          seasons: [{ name: "2025/2026", id: 78750 }],
        },
      ],
    },
    overallStatsData: { statistics: statsFromStandingRow(row) },
  };
}
