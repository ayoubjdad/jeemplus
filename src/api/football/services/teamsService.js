import { footballGet, extractResponse } from "../client.js";
import { LEAGUES } from "../constants.js";
import { mapTeam } from "../mappers/mapTeam.js";
import { mapTeamStatistics } from "../mappers/mapTeamStatistics.js";
import { mapFixtures } from "../mappers/mapFixture.js";
import { mapStandingRow } from "../mappers/mapStandingRow.js";

export async function getTeamInfo(teamId) {
  const data = await footballGet("teams", { id: teamId });
  const item = extractResponse(data)[0];
  const team = mapTeam(item?.team ?? item);
  const venue = item?.venue;
  if (venue) {
    team.venue = {
      name: venue.name,
      city: { name: venue.city },
      capacity: venue.capacity,
      country: { name: venue.address },
    };
  }
  return team;
}

export async function getTeamDetail(teamId) {
  const { id: leagueId, season } = LEAGUES.BOTOLA_PRO;

  const [team, statsRes, fixturesRes, standingsRes] = await Promise.all([
    getTeamInfo(teamId),
    footballGet("teams/statistics", { team: teamId, league: leagueId, season }).catch(
      () => ({ response: [] }),
    ),
    footballGet("fixtures", { team: teamId, last: 10, season }).catch(() => ({
      response: [],
    })),
    footballGet("standings", { league: leagueId, season }).catch(() => ({
      response: [],
    })),
  ]);

  const overallStats = mapTeamStatistics(extractResponse(statsRes));
  const performanceEvents = mapFixtures(extractResponse(fixturesRes));

  const standingRows =
    extractResponse(standingsRes)?.[0]?.league?.standings?.[0] ?? [];
  const myRow = standingRows.find((r) => r.team?.id === Number(teamId));
  const mappedRow = myRow ? mapStandingRow(myRow) : null;

  const form = (mappedRow?.form ?? "").split("").filter(Boolean);

  return {
    team: {
      ...team,
      primaryUniqueTournament: { name: "Botola Pro" },
      manager: null,
    },
    pregameForm: {
      form,
      position: mappedRow?.position ?? "—",
      value: mappedRow?.points ?? "—",
    },
    performanceEvents,
    uniqueTournaments: [{ id: leagueId, name: "Botola Pro", category: { name: "Morocco" } }],
    overallStats,
  };
}

function parseScore(goals) {
  if (typeof goals === "number") return goals;
  return 0;
}

/** Compute BTTS, over 2.5, etc. from last fixtures */
export function computeTeamForm(fixtures, teamId) {
  const finished = (fixtures ?? []).filter(
    (f) => f.status?.type === "finished",
  );

  let unbeaten = 0;
  let over25 = 0;
  let btts = 0;
  let firstConceded = 0;

  for (const f of finished) {
    const isHome = f.homeTeam.id === Number(teamId);
    const gf = parseScore(isHome ? f.homeScore?.display : f.awayScore?.display);
    const ga = parseScore(isHome ? f.awayScore?.display : f.homeScore?.display);
    const total = gf + ga;

    if (gf >= ga) unbeaten += 1;
    if (total > 2.5) over25 += 1;
    if (gf > 0 && ga > 0) btts += 1;
    if (ga > 0 && gf === 0) firstConceded += 1;
  }

  return {
    unbeaten: `${unbeaten}/${finished.length}`,
    over25: `${over25}/${finished.length}`,
    btts: `${btts}/${finished.length}`,
    firstConceded: `${firstConceded}/${finished.length}`,
  };
}

export async function getTeamForm(teamId) {
  const data = await footballGet("fixtures", {
    team: teamId,
    last: 15,
    season: LEAGUES.BOTOLA_PRO.season,
  });
  const fixtures = mapFixtures(extractResponse(data));
  return computeTeamForm(fixtures, teamId);
}
