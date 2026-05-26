/** Current season year for European leagues (2025/26 → 2025). */
export const CURRENT_SEASON = 2025;

export const LEAGUES = {
  WORLD_CUP: { id: 1, season: 2026 },
  BOTOLA_PRO: { id: 200, season: CURRENT_SEASON },
  PREMIER_LEAGUE: { id: 39, season: CURRENT_SEASON },
  LA_LIGA: { id: 140, season: CURRENT_SEASON },
  SERIE_A: { id: 135, season: CURRENT_SEASON },
  BUNDESLIGA: { id: 78, season: CURRENT_SEASON },
  LIGUE_1: { id: 61, season: CURRENT_SEASON },
  CHAMPIONS_LEAGUE: { id: 2, season: CURRENT_SEASON },
  EUROPA_LEAGUE: { id: 3, season: CURRENT_SEASON },
  SAUDI_PRO: { id: 307, season: CURRENT_SEASON },
  CAF_CHAMPIONS: { id: 12, season: CURRENT_SEASON },
  CAF_CONFED: { id: 20, season: CURRENT_SEASON },
  AFCON: { id: 6, season: CURRENT_SEASON },
};

/** League IDs used to filter "Internationaux" and highlight match day. */
export const PRIORITY_LEAGUE_IDS = [
  LEAGUES.CHAMPIONS_LEAGUE.id,
  LEAGUES.EUROPA_LEAGUE.id,
  LEAGUES.PREMIER_LEAGUE.id,
  LEAGUES.LA_LIGA.id,
  LEAGUES.BUNDESLIGA.id,
  LEAGUES.SERIE_A.id,
  LEAGUES.LIGUE_1.id,
  LEAGUES.SAUDI_PRO.id,
  LEAGUES.WORLD_CUP.id,
  LEAGUES.BOTOLA_PRO.id,
  LEAGUES.CAF_CHAMPIONS.id,
  LEAGUES.CAF_CONFED.id,
  LEAGUES.AFCON.id,
];

/** Name-based filter for highlighted games (replaces SofaScore team IDs). */
export const TOP_TEAM_NAMES = [
  "Wydad",
  "Raja",
  "FUS Rabat",
  "RS Berkane",
  "AS FAR",
  "Bayern",
  "Dortmund",
  "Paris Saint-Germain",
  "PSG",
  "Monaco",
  "Marseille",
  "Liverpool",
  "Arsenal",
  "Chelsea",
  "Manchester City",
  "Newcastle",
  "Manchester United",
  "Barcelona",
  "Real Madrid",
  "Atlético",
  "Atletico",
  "Inter",
  "Napoli",
  "Juventus",
  "Roma",
  "Milan",
  "Spain",
  "Germany",
  "Netherlands",
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
