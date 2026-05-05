/**
 * Pre-built enriched rows for Internationalaux — inner `game` is stamped like scheduledGamesTemplate.
 */
export const moroccanEnrichedGamesTemplate = [
  {
    id: 99001002,
    game: {
      id: 99001002,
      homeTeam: {
        id: 2817,
        name: "Barcelona",
        shortName: "Barcelona",
        country: { name: "Spain", alpha2: "ES" },
      },
      awayTeam: {
        id: 44,
        name: "Liverpool",
        shortName: "Liverpool",
        country: { name: "England", alpha2: "EN" },
      },
      tournament: {
        uniqueTournament: { id: 7, name: "UEFA Champions League" },
      },
      startTimestamp: 0,
      status: { type: "finished", description: "Ended" },
      homeScore: { display: 3, period1: 2, normaltime: 3 },
      awayScore: { display: 2, period1: 1, normaltime: 2 },
    },
    homeTeam: {
      team: {
        id: 2817,
        name: "Barcelona",
        shortName: "Barcelona",
        country: { name: "Spain", alpha2: "ES" },
      },
      players: [
        {
          player: {
            id: 249437,
            name: "Hakim Ziyech",
            shortName: "Ziyech",
            country: { name: "Morocco", alpha2: "MA" },
          },
        },
      ],
    },
    awayTeam: {
      team: {
        id: 44,
        name: "Liverpool",
        shortName: "Liverpool",
        country: { name: "England", alpha2: "EN" },
      },
      players: [],
    },
  },
];
