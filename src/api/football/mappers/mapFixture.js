import {
  mappedFixtureHasIsrael,
  rawFixtureHasIsrael,
} from "../exclusions/israelExclusion.js";

/**
 * Map API-Football fixture status to app status types.
 * @param {{ short?: string, long?: string }} status
 */
export function mapFixtureStatus(status) {
  const short = status?.short ?? "";
  const long = status?.long ?? short;

  const liveCodes = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"];
  const finishedCodes = ["FT", "AET", "PEN", "AWD", "WO"];
  const notStartedCodes = ["TBD", "NS", "PST", "CANC", "ABD", "SUSP"];

  if (liveCodes.includes(short)) {
    return { type: "inprogress", description: long || "Live" };
  }
  if (finishedCodes.includes(short)) {
    return { type: "finished", description: long || "Finished" };
  }
  if (notStartedCodes.includes(short)) {
    return { type: "notstarted", description: long || "Scheduled" };
  }
  return { type: "notstarted", description: long || short || "Scheduled" };
}

function parseGoals(goals) {
  if (goals == null) return null;
  if (typeof goals === "number") return goals;
  return null;
}

/**
 * @param {Record<string, unknown>} fixtureItem - API-Football fixture response item
 */
export function mapFixture(fixtureItem) {
  const f = fixtureItem?.fixture ?? fixtureItem;
  const league = fixtureItem?.league ?? {};
  const teams = fixtureItem?.teams ?? {};
  const goals = fixtureItem?.goals ?? {};
  const score = fixtureItem?.score ?? {};

  const homeGoals = parseGoals(goals.home);
  const awayGoals = parseGoals(goals.away);
  const htHome = score?.halftime?.home;
  const htAway = score?.halftime?.away;

  const timestamp = f?.timestamp ?? 0;
  const status = mapFixtureStatus(f?.status ?? {});

  const mapSide = (side) => ({
    id: side?.id ?? 0,
    name: side?.name ?? "",
    shortName: side?.name ?? "",
    nameCode: side?.name?.slice(0, 3)?.toUpperCase() ?? "",
    logo: side?.logo ?? "",
    country: { name: "" },
    winner: side?.winner ?? null,
  });

  const winnerCode =
    teams.home?.winner === true
      ? 1
      : teams.away?.winner === true
        ? 2
        : homeGoals === awayGoals && homeGoals != null
          ? 3
          : null;

  return {
    id: f?.id ?? 0,
    startTimestamp: timestamp,
    status,
    homeTeam: mapSide(teams.home),
    awayTeam: mapSide(teams.away),
    homeScore: {
      display: homeGoals,
      period1: htHome,
      normaltime: homeGoals,
      overtime: score?.extratime?.home ?? null,
      current: homeGoals,
    },
    awayScore: {
      display: awayGoals,
      period1: htAway,
      normaltime: awayGoals,
      overtime: score?.extratime?.away ?? null,
      current: awayGoals,
    },
    tournament: {
      uniqueTournament: {
        id: league?.id ?? 0,
        name: league?.name ?? "",
        country: league?.country ?? "",
      },
      category: { name: league?.country ?? "" },
      name: league?.name ?? "",
    },
    league: {
      id: league?.id ?? 0,
      name: league?.name ?? "",
      country: league?.country ?? "",
      round: league?.round ?? "",
      logo: league?.logo ?? "",
    },
    roundInfo: { round: league?.round ?? "" },
    season: { name: String(league?.season ?? "") },
    venue: f?.venue
      ? {
          name: f.venue.name,
          city: { name: f.venue.city },
        }
      : null,
    referee: f?.referee ? { name: f.referee } : null,
    winnerCode,
  };
}

/** @param {unknown[]} items */
export function mapFixtures(items) {
  return (items ?? [])
    .filter((item) => !rawFixtureHasIsrael(item))
    .map(mapFixture)
    .filter((fixture) => !mappedFixtureHasIsrael(fixture));
}
