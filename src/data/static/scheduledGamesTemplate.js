/**
 * Scheduled-football snapshot (SofaScore-shaped events).
 * `startTimestamp` is overwritten by `stampGamesForViewerDate(date)` in screens.
 */
export const scheduledGamesTemplate = [
  {
    id: 99001001,
    homeTeam: {
      id: 36268,
      name: "Wydad Casablanca",
      shortName: "WAC",
      nameCode: "WAC",
      country: { name: "Morocco", alpha2: "MA" },
      teamColors: { primary: "#ff0000", secondary: "#ff0000", text: "#ff0000" },
      userCount: 165733,
    },
    awayTeam: {
      id: 41757,
      name: "Raja Club Athletic",
      shortName: "Raja CA",
      nameCode: "RCA",
      country: { name: "Morocco", alpha2: "MA" },
      teamColors: { primary: "#009966", secondary: "#ffffff", text: "#ffffff" },
      userCount: 160358,
    },
    tournament: {
      uniqueTournament: { id: 937, name: "Botola Pro" },
      category: { name: "Morocco" },
    },
    season: { name: "2025/2026" },
    roundInfo: { round: 18 },
    status: { type: "notstarted", description: "Not started" },
    startTimestamp: 0,
    homeScore: { display: 0, period1: 0, normaltime: 0 },
    awayScore: { display: 0, period1: 0, normaltime: 0 },
    venue: { capacity: 67000, name: "Mohammed V" },
    referee: { games: 120, yellowCards: 380, redCards: 9 },
    time: { injuryTime1: 1, injuryTime2: 3 },
  },
  {
    id: 99001002,
    homeTeam: {
      id: 2817,
      name: "Barcelona",
      shortName: "Barcelona",
      nameCode: "BAR",
      country: { name: "Spain", alpha2: "ES" },
      teamColors: { primary: "#004d98", secondary: "#a50044", text: "#ffffff" },
      userCount: 5000000,
    },
    awayTeam: {
      id: 44,
      name: "Liverpool",
      shortName: "Liverpool",
      nameCode: "LIV",
      country: { name: "England", alpha2: "EN" },
      teamColors: { primary: "#c8102e", secondary: "#ffffff", text: "#ffffff" },
      userCount: 4200000,
    },
    tournament: {
      uniqueTournament: { id: 7, name: "UEFA Champions League" },
      category: { name: "Europe" },
    },
    season: { name: "2025/2026" },
    roundInfo: { round: 5 },
    status: { type: "finished", description: "Ended" },
    startTimestamp: 0,
    homeScore: { display: 3, period1: 2, normaltime: 3 },
    awayScore: { display: 2, period1: 1, normaltime: 2 },
    venue: { capacity: 99354, name: "Camp Nou" },
    referee: { games: 90, yellowCards: 340, redCards: 6 },
    time: { injuryTime1: 3, injuryTime2: 5 },
  },
];
