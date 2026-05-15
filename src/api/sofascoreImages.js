/** SofaScore image CDN — prefer over api.sofascore.app for `<img src>` (hotlink / Referer). */
const ORIGIN = "https://img.sofascore.com/api/v1";

export function sofascoreTeamImageUrl(teamId) {
  if (teamId == null || teamId === "") return "";
  return `${ORIGIN}/team/${teamId}/image`;
}

export function sofascorePlayerImageUrl(playerId) {
  if (playerId == null || playerId === "") return "";
  return `${ORIGIN}/player/${playerId}/image`;
}

export function sofascoreManagerImageUrl(managerId) {
  if (managerId == null || managerId === "") return "";
  return `${ORIGIN}/manager/${managerId}/image`;
}

export function sofascoreUniqueTournamentImageUrl(uniqueTournamentId) {
  if (uniqueTournamentId == null || uniqueTournamentId === "") return "";
  return `${ORIGIN}/unique-tournament/${uniqueTournamentId}/image`;
}

export function sofascoreUniqueTournamentDarkImageUrl(uniqueTournamentId) {
  if (uniqueTournamentId == null || uniqueTournamentId === "") return "";
  return `${ORIGIN}/unique-tournament/${uniqueTournamentId}/image/dark`;
}

/** Pass to SofaScore `<img>` tags (and MUI `Avatar` via `slotProps={{ img: sofascoreImgProps }}`). */
export const sofascoreImgProps = { referrerPolicy: "no-referrer" };
