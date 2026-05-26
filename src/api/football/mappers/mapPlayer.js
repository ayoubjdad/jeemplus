/**
 * @param {Record<string, unknown>} player - API player object
 */
export function mapPlayer(player) {
  if (!player) {
    return {
      id: 0,
      name: "",
      shortName: "",
      photo: "",
      number: 0,
      position: "",
      nationality: "",
    };
  }
  return {
    id: player.id ?? 0,
    name: player.name ?? "",
    shortName: player.name ?? "",
    photo: player.photo ?? "",
    number: player.number ?? 0,
    position: player.position ?? "",
    nationality: player.nationality ?? "",
  };
}

/** Squad row from /players/squads */
export function mapSquadPlayers(squadResponse) {
  const players = squadResponse?.[0]?.players ?? squadResponse?.players ?? [];
  return players.map((p) => ({
    player: mapPlayer(p),
  }));
}

/** Top scorers / season stats row for TableView */
export function mapTopPlayerRow(item) {
  const player = item?.player ?? {};
  const stats = item?.statistics?.[0] ?? item?.statistics ?? {};
  const team = stats?.team ?? item?.team ?? {};
  const games = stats?.games ?? {};
  const goals = stats?.goals ?? {};
  const passes = stats?.passes ?? {};
  const dribbles = stats?.dribbles ?? {};
  const tackles = stats?.tackles ?? {};

  return {
    id: player.id ?? `${player.id}-${team.id}`,
    player: mapPlayer(player),
    team: {
      id: team.id ?? 0,
      name: team.name ?? "",
      shortName: team.name ?? "",
      logo: team.logo ?? "",
    },
    rating: games.rating ?? stats?.rating ?? null,
    goals: goals.total ?? 0,
    assists: goals.assists ?? 0,
    tackles: tackles?.total ?? 0,
    successfulDribbles: dribbles?.success ?? 0,
    accuratePassesPercentage: passes?.accuracy
      ? parseFloat(String(passes.accuracy).replace("%", ""))
      : null,
  };
}

/** Interactive screen tactic player */
export function mapPlayerToTactic(player) {
  const p = mapPlayer(player);
  const pos = p.position || "?";
  return {
    id: String(p.id),
    playerId: p.id,
    name: p.name,
    shortName: p.shortName,
    number: p.number,
    role: pos,
    positionGroup: pos.charAt(0),
    captain: false,
    rating: 7.0,
    ratingColor: "green",
    photo: p.photo,
  };
}
