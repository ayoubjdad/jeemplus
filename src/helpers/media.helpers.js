import { getBotolaTeamLogo } from "../constants/botolaTeamLogos";

export function teamLogo(team) {
  const botolaLogo = getBotolaTeamLogo(team?.id);
  if (botolaLogo) return botolaLogo;
  if (team?.logo) return team.logo;
  const label = encodeURIComponent(String(team?.name ?? "?").replace(/\s+/g, "+"));
  return `https://ui-avatars.com/api/?name=${label}&size=128&background=0f292e&color=c5e8e0&bold=true`;
}

export function playerPhoto(player) {
  if (player?.photo) return player.photo;
  if (player?.player?.photo) return player.player.photo;
  const label = encodeURIComponent(String(player?.name ?? "?").replace(/\s+/g, "+"));
  return `https://ui-avatars.com/api/?name=${label}&size=128&background=0f292e&color=c5e8e0&bold=true`;
}
