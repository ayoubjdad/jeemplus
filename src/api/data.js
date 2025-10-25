export const newsUrl = "https://arabic-news-api.p.rapidapi.com/aljazeera";
// export const newsUrl = "http://localhost:3000";

export const gamesUrl =
  "https://www.sofascore.com/api/v1/sport/football/scheduled-events/";
export const standingsUrls = [
  "https://www.sofascore.com/api/v1/unique-tournament/937/season/65433/standings/total", // Botola
  "https://www.sofascore.com/api/v1/unique-tournament/17/season/61627/standings/total", // Premier League
  "https://www.sofascore.com/api/v1/unique-tournament/8/season/61643/standings/total", // LaLiga
  "https://www.sofascore.com/api/v1/unique-tournament/34/season/61736/standings/total", // Ligue 1
  "https://www.sofascore.com/api/v1/unique-tournament/23/season/63515/standings/total", // Serie A
  "https://www.sofascore.com/api/v1/unique-tournament/35/season/63516/standings/total", // Bundesliga
];
export const teamLogo = (teamId) =>
  `https://api.sofascore.app/api/v1/team/${teamId}/image`;
export const tournamentLogo = (id) =>
  `https://api.sofascore.app/api/v1/unique-tournament/${id}/image/dark`;

export const team = "https://www.sofascore.com/api/v1/team/";
// https://www.sofascore.com/api/v1/team/3145/players
