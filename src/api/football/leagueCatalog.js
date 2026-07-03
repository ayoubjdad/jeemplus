import { CURRENT_SEASON, LEAGUES } from "./constants.js";

/** Known leagues from the landing sidebar — used as fallback when `/leagues` fails. */
export const LEAGUE_CATALOG = [
  {
    id_v3: LEAGUES.BOTOLA_PRO.id_v3,
    name: "Botola Pro",
    country: "Maroc",
    season: CURRENT_SEASON,
  },
  {
    id_v3: LEAGUES.PREMIER_LEAGUE.id_v3,
    name: "Premier League",
    country: "Angleterre",
    season: CURRENT_SEASON,
  },
  {
    id_v3: LEAGUES.LA_LIGA.id_v3,
    name: "LaLiga",
    country: "Espagne",
    season: CURRENT_SEASON,
  },
  {
    id_v3: LEAGUES.SERIE_A.id_v3,
    name: "Serie A",
    country: "Italie",
    season: CURRENT_SEASON,
  },
  {
    id_v3: LEAGUES.LIGUE_1.id_v3,
    name: "Ligue 1",
    country: "France",
    season: CURRENT_SEASON,
  },
  {
    id_v3: LEAGUES.BUNDESLIGA.id_v3,
    name: "Bundesliga",
    country: "Allemagne",
    season: CURRENT_SEASON,
  },
];

/** Sync lookup — prefer `resolveLeagueContext` for dynamic data. */
export function getLeagueByIdV3(id) {
  const entry = LEAGUE_CATALOG.find((l) => l.id_v3 === Number(id));
  if (!entry) return null;
  return {
    id: entry.id_v3,
    name: entry.name,
    country: entry.country,
    logo: leagueLogoUrl(entry.id_v3),
    seasons: [entry.season],
    season: entry.season,
  };
}

export function formatSeasonLabel(season) {
  return `${season}/${season + 1}`;
}

export const leagueLogoUrl = (idV3) =>
  `https://media.api-sports.io/football/leagues/${idV3}.png`;
