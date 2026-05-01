import axios from "axios";
import { worldCupCupTreesUrl, worldCupStandingsUrl } from "./data";

/** SofaScore returns `standings`: one `{ type: "total", rows, name, tournament }` per group */
export async function fetchWorldCupStandings() {
  const { data } = await axios.get(worldCupStandingsUrl);
  return Array.isArray(data?.standings) ? data.standings : [];
}

/** Knockout bracket: `{ cupTrees: [{ name, rounds: [{ description, blocks: [...] }] }] }` */
export async function fetchWorldCupCupTrees() {
  const { data } = await axios.get(worldCupCupTreesUrl);
  return Array.isArray(data?.cupTrees) ? data.cupTrees : [];
}
