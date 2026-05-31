function mapLineupSide(lineup) {
  if (!lineup) return { formation: null, players: [], coach: null };

  const startXI = (lineup.startXI ?? []).map((row) => ({
    player: {
      id: row.player?.id,
      name: row.player?.name,
      shortName: row.player?.name,
      number: row.player?.number,
    },
  }));

  return {
    formation: lineup.formation ?? null,
    players: startXI,
    coach: lineup.coach ? { name: lineup.coach.name, id: lineup.coach.id } : null,
  };
}

/** Map /fixtures/lineups */
export function mapFixtureLineups(apiResponse) {
  const lineups = Array.isArray(apiResponse) ? apiResponse : [];
  const home = lineups[0];
  const away = lineups[1];

  return {
    home: mapLineupSide(home),
    away: mapLineupSide(away),
  };
}
