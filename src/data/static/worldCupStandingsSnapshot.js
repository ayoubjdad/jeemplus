import raw from "./worldCupStandings.raw.json";

/** FIFA WC standings groups — same shape as `fetchWorldCupStandings()`. */
export const worldCupStandingsTables = raw.standings ?? [];
