import { getSofascoreApiV1Base } from "./sofascoreBase";

const v1 = () => getSofascoreApiV1Base();

export const newsUrl = "https://arabic-news-api.p.rapidapi.com/aljazeera";
// export const newsUrl = "http://localhost:3000";

export const gamesUrl = `${v1()}/sport/football/scheduled-events/`;
/** FIFA World Cup — qualification / season slug from SofaScore */
export const worldCupStandingsUrl = `${v1()}/unique-tournament/16/season/58210/standings/total`;

export const worldCupCupTreesUrl = `${v1()}/unique-tournament/16/season/58210/cuptrees`;

export const standingsUrls = [
  `${v1()}/unique-tournament/937/season/78750/standings/total`, // Botola
  `${v1()}/unique-tournament/17/season/61627/standings/total`, // Premier League
  `${v1()}/unique-tournament/8/season/61643/standings/total`, // LaLiga
  `${v1()}/unique-tournament/34/season/61736/standings/total`, // Ligue 1
  `${v1()}/unique-tournament/23/season/63515/standings/total`, // Serie A
  `${v1()}/unique-tournament/35/season/63516/standings/total`, // Bundesliga
];
export const teamLogo = (teamId) =>
  `https://api.sofascore.app/api/v1/team/${teamId}/image`;
export const tournamentLogo = (id) =>
  `https://api.sofascore.app/api/v1/unique-tournament/${id}/image/dark`;

export const team = `${v1()}/team/`;
// team/{id}/players
