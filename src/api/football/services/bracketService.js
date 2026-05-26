import { footballGet, extractResponse } from "../client.js";
import { LEAGUES } from "../constants.js";
import {
  mapBracketTree,
  groupFixturesByRound,
} from "../mappers/mapBracket.js";

export async function getWorldCupBracket() {
  const { id, season } = LEAGUES.WORLD_CUP;

  const [roundsRes, fixturesRes] = await Promise.all([
    footballGet("fixtures/rounds", { league: id, season }),
    footballGet("fixtures", { league: id, season }),
  ]);

  const roundsRaw = extractResponse(roundsRes);
  const roundList = Array.isArray(roundsRaw?.[0])
    ? roundsRaw[0]
    : Array.isArray(roundsRaw)
      ? roundsRaw.flat()
      : [];

  const rawFixtures = extractResponse(fixturesRes);
  const byRound = groupFixturesByRound(rawFixtures);

  const tree = mapBracketTree(roundList, byRound);
  return [tree];
}
