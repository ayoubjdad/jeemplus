/** Current season year for European leagues (2025/26 → 2025). */
export const CURRENT_SEASON = 2025;

export const LEAGUES = {
  BOTOLA_PRO: { id: 7474, id_v3: 200, season: CURRENT_SEASON },
  BOTOLA_PRO_2: { id: 7687, id_v3: 201, season: CURRENT_SEASON },
  THRONE_CUP: { id: 8260, id_v3: 822, season: CURRENT_SEASON },

  PREMIER_LEAGUE: { id: 7293, id_v3: 39, season: CURRENT_SEASON },
  CHAMPIONSHIP: { id: 7333, id_v3: 40, season: CURRENT_SEASON },
  FA_CUP: { id: 7508, id_v3: 45, season: CURRENT_SEASON },

  LA_LIGA: { id: 7351, id_v3: 140, season: CURRENT_SEASON },
  COPA_DEL_REY: { id: 7810, id_v3: 143, season: CURRENT_SEASON },

  LIGUE_1: { id: 7335, id_v3: 61, season: CURRENT_SEASON },
  LIGUE_2: { id: 7342, id_v3: 62, season: CURRENT_SEASON },
  COUPE_DE_FRANCE: { id: 7882, id_v3: 66, season: CURRENT_SEASON },

  SERIE_A: { id: 7286, id_v3: 135, season: CURRENT_SEASON },
  COPPA_ITALIA: { id: 7369, id_v3: 137, season: CURRENT_SEASON },

  BUNDESLIGA: { id: 7338, id_v3: 78, season: CURRENT_SEASON },
  DBF_POKAL: { id: 7291, id_v3: 81, season: CURRENT_SEASON },

  UEFA_CHAMPIONS_LEAGUE: { id: 7902, id_v3: 2, season: 2026 },
  UEFA_EUROPA_LEAGUE: { id: 7903, id_v3: 3, season: 2026 },

  CAF_CHAMPIONS_LEAGUE: { id: 7904, id_v3: 12, season: 2026 },
  CAF_CONFEDERATION_CUP: { id: 7905, id_v3: 20, season: 2026 },
  AFRICA_CUP_OF_NATIONS: { id: 7906, id_v3: 6, season: 2026 },

  WORLD_CUP: { id: 7902, id_v3: 1, season: 2026 },
  FRIENDLIES: { id: 7977, id_v3: 10, season: 2026 },
  // FRIENDLIES_CLUBS: { id: 7979, id_v3: 667, season: 2026 },

  AFRICA_CUP_OF_NATIONS_QUALIFICATION: { id: 8203, id_v3: 36, season: 2027 },
  CAF_CUP_OF_NATIONS_U17: { id: 8258, id_v3: 973, season: 2026 },

  UEFA_NATIONS_LEAGUE: { id: 8148, id_v3: 5, season: 2026 },

  ASIAN_CUP: { id: 8204, id_v3: 7, season: 2027 },

  CONMEBOL_LIBERTADORES: { id: 7919, id_v3: 13, season: 2026 },
  CONMEBOL_SUDAMERICANA: { id: 7971, id_v3: 11, season: 2026 },
};

/** League IDs used to filter "Internationaux" and highlight match day. */
export const PRIORITY_LEAGUE_IDS = Object.values(LEAGUES).map(
  (league) => league.id_v3
);

export const MOROCCAN_PLAYERS_PRIORITY_LEAGUE_IDS = [
  LEAGUES.PREMIER_LEAGUE.id_v3,
  LEAGUES.CHAMPIONSHIP.id_v3,
  LEAGUES.FA_CUP.id_v3,
  LEAGUES.LA_LIGA.id_v3,
  LEAGUES.COPA_DEL_REY.id_v3,
  LEAGUES.LIGUE_1.id_v3,
  LEAGUES.LIGUE_2.id_v3,
  LEAGUES.COUPE_DE_FRANCE.id_v3,
  LEAGUES.SERIE_A.id_v3,
  LEAGUES.COPPA_ITALIA.id_v3,
  LEAGUES.BUNDESLIGA.id_v3,
  LEAGUES.DBF_POKAL.id_v3,
  LEAGUES.UEFA_CHAMPIONS_LEAGUE.id_v3,
  LEAGUES.UEFA_EUROPA_LEAGUE.id_v3,
];

/** Name-based filter for highlighted games (replaces SofaScore team IDs). */
export const TOP_TEAM_NAMES = [
  { alias: "Morocco", id: 31 },
  { alias: "Wydad AC", id: 36268 },
  { alias: "Raja", id: 976 },
  { alias: "FUS Rabat", id: 977 },
  { alias: "RS Berkane", id: 962 },
  { alias: "AS FAR", id: 969 },
  { alias: "Bayern", id: 157 },
  { alias: "Dortmund", id: 165 },
  { alias: "Paris Saint-Germain", id: 85 },
  { alias: "Marseille", id: 81 },
  { alias: "Liverpool", id: 40 },
  { alias: "Arsenal", id: 42 },
  { alias: "Chelsea", id: 49 },
  { alias: "Manchester City", id: 50 },
  { alias: "Manchester United", id: 33 },
  { alias: "Barcelona", id: 529 },
  { alias: "Real Madrid", id: 541 },
  { alias: "Atletico", id: 530 },
  { alias: "Inter", id: 505 },
  { alias: "Napoli", id: 492 },
  { alias: "Juventus", id: 496 },
  { alias: "Roma", id: 497 },
  { alias: "Milan", id: 489 },
  { alias: "Spain", id: 9 },
  { alias: "Germany", id: 25 },
  { alias: "Netherlands", id: 23 },
];

export const MOROCCO_NATIONALITY = "Morocco";

/** Knockout round order for World Cup bracket builder. */
export const KNOCKOUT_ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Quarterfinal",
  "Semi-finals",
  "Semifinal",
  "3rd Place Final",
  "Final",
];
