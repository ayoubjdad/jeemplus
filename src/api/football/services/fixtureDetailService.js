import { footballGet, extractResponse } from "../client.js";
import { mapFixture } from "../mappers/mapFixture.js";
import { rawFixtureHasIsrael } from "../exclusions/israelExclusion.js";
import { mapFixtureStatistics } from "../mappers/mapFixtureStatistics.js";
import { mapFixtureEvents } from "../mappers/mapFixtureEvents.js";
import { mapFixtureLineups } from "../mappers/mapFixtureLineups.js";

export async function getFixtureDetail(fixtureId) {
  const [fixtureRes, statsRes, eventsRes, lineupsRes] = await Promise.all([
    footballGet("fixtures", { id: fixtureId }),
    footballGet("fixtures/statistics", { fixture: fixtureId }).catch(() => ({
      response: [],
    })),
    footballGet("fixtures/events", { fixture: fixtureId }).catch(() => ({
      response: [],
    })),
    footballGet("fixtures/lineups", { fixture: fixtureId }).catch(() => ({
      response: [],
    })),
  ]);

  const fixtures = extractResponse(fixtureRes);
  const raw = fixtures[0];
  if (!raw || rawFixtureHasIsrael(raw)) return null;

  const event = mapFixture(raw);

  if (!event) return null;

  const statsRaw = extractResponse(statsRes);
  const eventsRaw = extractResponse(eventsRes);
  const lineupsRaw = extractResponse(lineupsRes);

  const statistics = mapFixtureStatistics(statsRaw);
  const incidents = mapFixtureEvents(
    eventsRaw,
    event.homeTeam?.id,
    event.awayTeam?.id,
  );
  const lineups = mapFixtureLineups(lineupsRaw);

  const homeCoach = lineups.home?.coach?.name;
  const awayCoach = lineups.away?.coach?.name;
  if (homeCoach) event.homeTeam = { ...event.homeTeam, manager: { name: homeCoach } };
  if (awayCoach) event.awayTeam = { ...event.awayTeam, manager: { name: awayCoach } };

  const venue = raw?.fixture?.venue;
  if (venue) {
    event.venue = {
      name: venue.name,
      city: { name: venue.city },
      capacity: null,
      venueCoordinates: null,
    };
  }

  return {
    event,
    statistics,
    incidents,
    lineups,
  };
}
