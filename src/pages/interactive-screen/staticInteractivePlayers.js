/** Static squad for the interactive screen (demo data). */
export const STATIC_TEAM_PLAYERS = [
  {
    id: "p1",
    name: "S. Lammens",
    number: 31,
    rating: 7.5,
    ratingColor: "green",
    role: "GK",
    captain: false,
  },
  {
    id: "p2",
    name: "D. Dalot",
    number: 2,
    rating: 6.8,
    ratingColor: "orange",
    role: "RB",
    captain: false,
  },
  {
    id: "p3",
    name: "H. Maguire",
    number: 5,
    rating: 8.0,
    ratingColor: "cyan",
    role: "CB",
    captain: false,
  },
  {
    id: "p4",
    name: "A. Heaven",
    number: 26,
    rating: 7.1,
    ratingColor: "green",
    role: "CB",
    captain: false,
  },
  {
    id: "p5",
    name: "L. Shaw",
    number: 23,
    rating: 7.1,
    ratingColor: "green",
    role: "LB",
    captain: false,
  },
  {
    id: "p6",
    name: "Casemiro",
    number: 18,
    rating: 9.2,
    ratingColor: "blue",
    role: "LDM",
    captain: false,
  },
  {
    id: "p7",
    name: "K. Mainoo",
    number: 37,
    rating: 7.8,
    ratingColor: "green",
    role: "RDM",
    captain: false,
  },
  {
    id: "p8",
    name: "B. Mbeumo",
    number: 19,
    rating: 6.6,
    ratingColor: "orange",
    role: "RW",
    captain: false,
  },
  {
    id: "p9",
    name: "B. Fernandes",
    number: 8,
    rating: 7.9,
    ratingColor: "green",
    role: "CAM",
    captain: true,
  },
  {
    id: "p10",
    name: "A. Diallo",
    number: 16,
    rating: 6.6,
    ratingColor: "orange",
    role: "LW",
    captain: false,
  },
  {
    id: "p11",
    name: "B. Šeško",
    number: 30,
    rating: 7.5,
    ratingColor: "green",
    role: "ST",
    captain: false,
  },
];

/**
 * 4-2-3-1 en % sur un terrain horizontal (but à gauche / droite).
 * x = profondeur (0 % = but défendu, 100 % = but adverse), y = largeur (0–100 % = touchline à touchline).
 */
export const DEFAULT_FORMATION_4231 = {
  p1: { x: 7, y: 50 },
  p2: { x: 22, y: 82 },
  p3: { x: 18, y: 62 },
  p4: { x: 18, y: 38 },
  p5: { x: 22, y: 18 },
  p6: { x: 38, y: 40 },
  p7: { x: 38, y: 60 },
  p8: { x: 52, y: 86 },
  p9: { x: 50, y: 50 },
  p10: { x: 52, y: 14 },
  p11: { x: 74, y: 50 },
};

const FORMATION_SLOT_KEYS = [
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "p10",
  "p11",
];

/** Ordered slots (GK … ST) for assigning the first N players from a live roster. */
export const DEFAULT_FORMATION_SLOTS_4231 = FORMATION_SLOT_KEYS.map(
  (k) => DEFAULT_FORMATION_4231[k]
);
