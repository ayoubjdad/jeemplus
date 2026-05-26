import { getTeamSquadAsTactic } from "../../api/football/services/playersService";

export async function fetchTeamPlayersRoster(teamId) {
  return getTeamSquadAsTactic(teamId);
}
