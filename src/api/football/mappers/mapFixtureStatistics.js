/** Map /fixtures/statistics to flat stat rows (app-compatible shape). */
export function mapFixtureStatistics(apiResponse) {
  const teams = Array.isArray(apiResponse) ? apiResponse : [];
  if (teams.length < 2) {
    return { statistics: [] };
  }

  const homeTeam = teams[0];
  const awayTeam = teams[1];

  const homeStats = homeTeam?.statistics ?? [];
  const awayStats = awayTeam?.statistics ?? [];

  const byType = (stats, type) =>
    stats.find((s) => s.type === type)?.value ?? null;

  const allTypes = new Set([
    ...homeStats.map((s) => s.type),
    ...awayStats.map((s) => s.type),
  ]);

  const items = [];
  for (const type of allTypes) {
    const homeVal = byType(homeStats, type);
    const awayVal = byType(awayStats, type);
    if (homeVal == null && awayVal == null) continue;

    let name = type;
    if (type === "Ball Possession") name = "Ball possession";
    if (type === "Total Shots") name = "total shots";
    if (type === "Shots on Goal") name = "shots on goal";
    if (type === "Corner Kicks") name = "corner kicks";
    if (type === "Expected Goals") name = "expected goals";

    items.push({
      name,
      home: homeVal,
      away: awayVal,
      homeValue: homeVal,
      awayValue: awayVal,
    });
  }

  return {
    statistics: [
      {
        period: "ALL",
        groups: [{ statisticsItems: items }],
      },
    ],
  };
}
