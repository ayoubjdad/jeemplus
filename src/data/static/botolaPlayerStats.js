import raw from "./botolaPlayerStats.raw.json";

/** SofaScore Botola player statistics snapshot (`statistics` endpoint `results`). */
export const botolaPlayerStatsResults = raw.results ?? [];
