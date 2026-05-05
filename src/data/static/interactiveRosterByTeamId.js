import { botolaStandingsTables } from "./botolaStandings";

/** Minimal tactic roster reused per Botola club for the interactive pitch (offline snapshot). */
const stubRoster = [
  {
    id: "9200001",
    sofaPlayerId: 9200001,
    name: "Amine Snapshot",
    shortName: "Amine",
    number: 1,
    role: "G",
    positionGroup: "G",
    captain: true,
    rating: 7.0,
    ratingColor: "green",
  },
  {
    id: "9200002",
    sofaPlayerId: 9200002,
    name: "Youssef Snapshot",
    shortName: "Youssef",
    number: 4,
    role: "D",
    positionGroup: "D",
    captain: false,
    rating: 6.9,
    ratingColor: "green",
  },
  {
    id: "9200003",
    sofaPlayerId: 9200003,
    name: "Mehdi Snapshot",
    shortName: "Mehdi",
    number: 5,
    role: "D",
    positionGroup: "D",
    captain: false,
    rating: 7.1,
    ratingColor: "green",
  },
  {
    id: "9200004",
    sofaPlayerId: 9200004,
    name: "Omar Snapshot",
    shortName: "Omar",
    number: 2,
    role: "D",
    positionGroup: "D",
    captain: false,
    rating: 6.8,
    ratingColor: "orange",
  },
  {
    id: "9200005",
    sofaPlayerId: 9200005,
    name: "Karim Snapshot",
    shortName: "Karim",
    number: 3,
    role: "D",
    positionGroup: "D",
    captain: false,
    rating: 6.9,
    ratingColor: "green",
  },
  {
    id: "9200006",
    sofaPlayerId: 9200006,
    name: "Soufiane Snapshot",
    shortName: "Soufiane",
    number: 6,
    role: "M",
    positionGroup: "M",
    captain: false,
    rating: 7.3,
    ratingColor: "green",
  },
  {
    id: "9200007",
    sofaPlayerId: 9200007,
    name: "Adam Snapshot",
    shortName: "Adam",
    number: 8,
    role: "M",
    positionGroup: "M",
    captain: false,
    rating: 7.2,
    ratingColor: "green",
  },
  {
    id: "9200008",
    sofaPlayerId: 9200008,
    name: "Walid Snapshot",
    shortName: "Walid",
    number: 10,
    role: "M",
    positionGroup: "M",
    captain: false,
    rating: 7.4,
    ratingColor: "cyan",
  },
  {
    id: "9200009",
    sofaPlayerId: 9200009,
    name: "Hamza Snapshot",
    shortName: "Hamza",
    number: 7,
    role: "M",
    positionGroup: "M",
    captain: false,
    rating: 7.0,
    ratingColor: "green",
  },
  {
    id: "9200010",
    sofaPlayerId: 9200010,
    name: "Rayan Snapshot",
    shortName: "Rayan",
    number: 11,
    role: "F",
    positionGroup: "F",
    captain: false,
    rating: 7.5,
    ratingColor: "cyan",
  },
  {
    id: "9200011",
    sofaPlayerId: 9200011,
    name: "Anas Snapshot",
    shortName: "Anas",
    number: 9,
    role: "F",
    positionGroup: "F",
    captain: false,
    rating: 7.3,
    ratingColor: "green",
  },
];

const rows = botolaStandingsTables[0]?.rows ?? [];

/** @type {Record<number, typeof stubRoster>} */
export const interactiveRosterByTeamId = Object.fromEntries(
  rows.map((r) => [r.team.id, stubRoster])
);

/** @param {number | string | null | undefined} teamId */
export function getInteractiveRoster(teamId) {
  const id = Number(teamId);
  if (!Number.isFinite(id)) return [];
  return interactiveRosterByTeamId[id] ?? stubRoster;
}
