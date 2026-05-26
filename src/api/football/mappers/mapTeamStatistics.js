/** Map /teams/statistics to TeamDetail overall stats shape */
export function mapTeamStatistics(apiResponse) {
  const stats = apiResponse?.[0] ?? apiResponse ?? {};
  if (!stats || typeof stats !== "object") return {};

  const fixtures = stats.fixtures ?? {};
  const goals = stats.goals ?? {};
  const passes = stats.passes ?? {};
  const shots = stats.shots ?? {};

  const played = fixtures.played?.total ?? 0;

  return {
    matches: played,
    goalsScored: goals.for?.total?.total ?? goals.for?.total ?? 0,
    goalsConceded: goals.against?.total?.total ?? goals.against?.total ?? 0,
    assists: 0,
    shots: shots.total ?? 0,
    shotsAgainst: 0,
    penaltyGoals: goals.for?.total?.penalty ?? 0,
    penaltiesTaken: 0,
    successfulDribbles: 0,
    dribbleAttempts: 0,
    corners: 0,
    offsides: 0,
    averageBallPossession: null,
    accuratePasses: passes.total ?? 0,
    accuratePassesPercentage: passes.accuracy
      ? parseFloat(String(passes.accuracy).replace("%", ""))
      : null,
    cleanSheets: null,
    interceptions: 0,
    saves: 0,
    tackles: 0,
    yellowCards: 0,
    redCards: 0,
    yellowRedCards: 0,
    fouls: 0,
    duelsWon: 0,
    duelsWonPercentage: null,
    aerialDuelsWon: 0,
    aerialDuelsWonPercentage: null,
    freeKicks: 0,
    totalPasses: passes.total ?? 0,
    totalLongBalls: 0,
    totalCrosses: 0,
    accurateLongBalls: 0,
    accurateLongBallsPercentage: null,
    accurateCrosses: 0,
    accurateCrossesPercentage: null,
    errorsLeadingToShot: 0,
    errorsLeadingToGoal: 0,
    hitWoodwork: 0,
    bigChancesCreated: 0,
    bigChancesMissed: 0,
    blockedScoringAttempt: 0,
    clearances: 0,
    ballRecovery: 0,
    goalKicks: 0,
    awardedMatches: 0,
  };
}
