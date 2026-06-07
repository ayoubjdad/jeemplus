const POSITION_KEYS = {
  goalkeeper: "goalkeeper",
  defender: "defender",
  midfielder: "midfielder",
  attacker: "attacker",
  forward: "forward",
  g: "goalkeeper",
  d: "defender",
  m: "midfielder",
  f: "attacker",
  a: "attacker",
};

/** Maps API position codes/names to a localized label. */
export function translatePlayerPosition(t, position) {
  if (!position) return "";
  const key = POSITION_KEYS[String(position).trim().toLowerCase()];
  return key ? t(`positions.${key}`) : position;
}
