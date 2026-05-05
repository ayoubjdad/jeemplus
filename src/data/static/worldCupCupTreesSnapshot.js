import raw from "./worldCupCupTrees.raw.json";

/** FIFA WC knockout trees — same shape as `fetchWorldCupCupTrees()`. */
export const worldCupCupTrees = raw.cupTrees ?? [];
