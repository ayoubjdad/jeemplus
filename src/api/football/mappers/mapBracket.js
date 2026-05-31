import { KNOCKOUT_ROUND_ORDER } from "../constants.js";
import { mapFixture } from "./mapFixture.js";

function roundOrder(name) {
  const idx = KNOCKOUT_ROUND_ORDER.findIndex(
    (r) => r.toLowerCase() === (name ?? "").toLowerCase(),
  );
  return idx >= 0 ? idx : 99;
}

/**
 * Each fixture = one knockout match block (home vs away).
 * @param {ReturnType<typeof mapFixture>[]} fixtures
 */
function fixturesToBlocks(fixtures) {
  return (fixtures ?? []).map((f, index) => {
    const homeWinner = f.winnerCode === 1;
    const awayWinner = f.winnerCode === 2;

    return {
      id: f.id,
      blockId: f.id,
      order: index + 1,
      finished: f.status?.type === "finished",
      seriesStartDateTimestamp: f.startTimestamp,
      participants: [
        {
          order: 1,
          winner: homeWinner,
          team: {
            id: f.homeTeam.id,
            name: f.homeTeam.name,
            shortName: f.homeTeam.shortName,
            logo: f.homeTeam.logo,
            national: true,
            disabled: false,
          },
        },
        {
          order: 2,
          winner: awayWinner,
          team: {
            id: f.awayTeam.id,
            name: f.awayTeam.name,
            shortName: f.awayTeam.shortName,
            logo: f.awayTeam.logo,
            national: true,
            disabled: false,
          },
        },
      ],
    };
  });
}

/**
 * Build cup tree structure from rounds + fixtures grouped by round.
 * @param {string[]} rounds
 * @param {Record<string, ReturnType<typeof mapFixture>[]>} fixturesByRound
 */
export function mapBracketTree(rounds, fixturesByRound) {
  const knockoutRounds = (rounds ?? [])
    .filter((r) => !/group/i.test(r))
    .sort((a, b) => roundOrder(a) - roundOrder(b));

  const treeRounds = knockoutRounds.map((description, order) => {
    const fixtures = fixturesByRound[description] ?? [];
    return {
      id: order,
      order,
      description,
      blocks: fixturesToBlocks(fixtures),
    };
  });

  return {
    id: "world-cup-bracket",
    name: "Phase à élimination",
    tournament: { name: "Coupe du monde" },
    rounds: treeRounds,
  };
}

/** @param {unknown[]} rawFixtures */
export function groupFixturesByRound(rawFixtures) {
  const mapped = (rawFixtures ?? []).map((item) => mapFixture(item));
  /** @type {Record<string, ReturnType<typeof mapFixture>[]>} */
  const byRound = {};
  for (const f of mapped) {
    const round = f.league?.round || f.roundInfo?.round || "Unknown";
    if (!byRound[round]) byRound[round] = [];
    byRound[round].push(f);
  }
  for (const key of Object.keys(byRound)) {
    byRound[key].sort((a, b) => a.startTimestamp - b.startTimestamp);
  }
  return byRound;
}
