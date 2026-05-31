/** Map /fixtures/events to incidents summary + timeline */
export function mapFixtureEvents(apiResponse, homeTeamId, awayTeamId) {
  const events = Array.isArray(apiResponse) ? apiResponse : [];

  const incidents = events.map((ev) => {
    const type = ev.type?.toLowerCase() ?? "";
    let incidentType = type;
    let incidentClass = "";

    if (type === "goal") incidentType = "goal";
    if (type === "card") {
      incidentType = "card";
      incidentClass = ev.detail?.toLowerCase()?.includes("red") ? "red" : "yellow";
    }
    if (type === "subst") incidentType = "substitution";

    const teamId = ev.team?.id;
    let isHome = null;
    if (teamId != null && homeTeamId != null && Number(teamId) === Number(homeTeamId)) {
      isHome = true;
    } else if (teamId != null && awayTeamId != null && Number(teamId) === Number(awayTeamId)) {
      isHome = false;
    }

    return {
      incidentType,
      incidentClass,
      type: incidentType,
      time: ev.time?.elapsed ?? 0,
      addedTime: ev.time?.extra ?? 0,
      timeSeconds: (ev.time?.elapsed ?? 0) * 60,
      isHome,
      teamId,
      player: ev.player
        ? { name: ev.player.name, shortName: ev.player.name }
        : null,
      assist1: ev.assist
        ? { name: ev.assist.name, shortName: ev.assist.name }
        : null,
      homeScore: ev.score?.home ?? null,
      awayScore: ev.score?.away ?? null,
      detail: ev.detail,
    };
  });

  return { incidents };
}
