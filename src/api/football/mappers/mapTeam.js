/**
 * @param {Record<string, unknown>} team - API team object
 */
export function mapTeam(team) {
  if (!team) {
    return { id: 0, name: "", shortName: "", logo: "", country: { name: "", code: "" } };
  }
  return {
    id: team.id ?? 0,
    name: team.name ?? "",
    shortName: team.name ?? "",
    fullName: team.name ?? "",
    logo: team.logo ?? "",
    country: {
      name: team.country ?? "",
      alpha2: "",
    },
  };
}
