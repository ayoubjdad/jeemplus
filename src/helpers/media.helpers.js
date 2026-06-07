import { getBotolaTeamLogo } from "../constants/botolaTeamLogos";

export function teamLogo(team) {
  const botolaLogo = getBotolaTeamLogo(team?.id);
  if (botolaLogo) return botolaLogo;
  if (team?.logo) return team.logo;
  const label = encodeURIComponent(String(team?.name ?? "?").replace(/\s+/g, "+"));
  return `https://ui-avatars.com/api/?name=${label}&size=128&background=7b2fa0&color=ffffff&bold=true`;
}

export function playerPhoto(player) {
  if (player?.photo) return player.photo;
  if (player?.player?.photo) return player.player.photo;
  return fallbackPlayerPhoto(player);
}

export function fallbackPlayerPhoto(player) {
  const label = encodeURIComponent(String(player?.name ?? "?").replace(/\s+/g, "+"));
  return `https://ui-avatars.com/api/?name=${label}&size=128&background=f3ecf8&color=7b2fa0&bold=true`;
}
