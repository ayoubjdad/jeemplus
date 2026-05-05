import { scheduledGamesTemplate } from "./scheduledGamesTemplate";

function cloneTemplate(index) {
  return structuredClone(scheduledGamesTemplate[index]);
}

const statisticsFinished = {
  statistics: [
    {
      period: "ALL",
      groups: [
        {
          groupName: "Match overview",
          statisticsItems: [
            { name: "Ball possession", home: "54%", away: "46%" },
            { name: "Total shots", home: "14", away: "11" },
            { name: "Shots on goal", home: "6", away: "5" },
            { name: "Corner kicks", home: "7", away: "4" },
            { name: "Expected goals", home: "1.9", away: "1.4" },
            { name: "Offsides", home: "2", away: "3" },
            { name: "Fouls", home: "14", away: "13" },
          ],
        },
      ],
    },
  ],
};

const statisticsScheduled = { statistics: [] };

/** Fallback route match detail when id unknown */
export const DEMO_GAME_DETAIL_ID = 99001002;

function bundleBotola() {
  const event = cloneTemplate(0);
  event.hasXg = false;
  event.hasEventPlayerStatistics = false;
  event.hasEventPlayerHeatMap = false;
  event.hasGlobalHighlights = false;
  event.customId = `snapshot-${event.id}`;
  return {
    event,
    statistics: statisticsScheduled,
    incidents: { incidents: [] },
    lineups: {
      home: { formation: "4-2-3-1" },
      away: { formation: "4-3-3" },
    },
  };
}

function bundleUcl() {
  const event = cloneTemplate(1);
  event.winnerCode = 1;
  event.hasXg = true;
  event.hasEventPlayerStatistics = true;
  event.hasEventPlayerHeatMap = false;
  event.hasGlobalHighlights = false;
  event.customId = `snapshot-${event.id}`;
  return {
    event,
    statistics: statisticsFinished,
    incidents: {
      incidents: [
        {
          timeSeconds: 420,
          incidentClass: "goal",
          isHome: true,
          player: { name: "Snapshot Striker", slug: "snapshot" },
        },
      ],
    },
    lineups: {
      home: { formation: "4-3-3" },
      away: { formation: "4-3-3" },
    },
  };
}

/** @type {Record<number, ReturnType<typeof bundleBotola>>} */
export const gameDetailByEventId = {
  99001001: bundleBotola(),
  99001002: bundleUcl(),
};

/**
 * @param {string | undefined} rawEventId
 */
export function getGameDetailParts(rawEventId) {
  const id = Number(rawEventId);
  if (Number.isFinite(id) && gameDetailByEventId[id]) {
    return gameDetailByEventId[id];
  }
  return gameDetailByEventId[DEMO_GAME_DETAIL_ID];
}
