import { IMG, LEAGUE_FR } from "../data/data.helper";

export function startOfDay(value) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function shiftDay(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toFotmobDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateLabel(date) {
  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return "Aujourd'hui";
  if (isSameDay(date, shiftDay(today, -1))) return "Hier";
  if (isSameDay(date, shiftDay(today, 1))) return "Demain";
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function teamLogo(teamId) {
  return `${IMG}/logo/teamlogo/${teamId}_xsmall.png`;
}

export function playerPhoto(playerId) {
  return `${IMG}/playerimages/${playerId}.png`;
}

export function leagueLogo(leagueId) {
  return `${IMG}/logo/leaguelogo/${leagueId}.png`;
}

export function displayLeagueName(league) {
  return LEAGUE_FR[league.primaryId] || league.name;
}

export function isLive(match) {
  return Boolean(
    match?.status?.started &&
    !match?.status?.finished &&
    !match?.status?.cancelled,
  );
}

export function isFinished(match) {
  return Boolean(match?.status?.finished);
}

export function collectPinnedTeamMatches(leagues, pinnedIds) {
  const byTeamId = new Map();

  for (const league of leagues || []) {
    if (!pinnedIds.has(league.primaryId)) continue;

    for (const match of league.matches || []) {
      const homeId = match.home?.id;
      const awayId = match.away?.id;

      if (homeId != null && !byTeamId.has(homeId)) {
        byTeamId.set(homeId, {
          teamId: homeId,
          teamName: match.home?.name || match.home?.longName,
          opponentId: awayId,
          opponentName: match.away?.name || match.away?.longName,
          isHome: true,
          match,
        });
      }

      if (awayId != null && !byTeamId.has(awayId)) {
        byTeamId.set(awayId, {
          teamId: awayId,
          teamName: match.away?.name || match.away?.longName,
          opponentId: homeId,
          opponentName: match.home?.name || match.home?.longName,
          isHome: false,
          match,
        });
      }
    }
  }

  return byTeamId;
}

export function extractMoroccanPlayers(payload) {
  const groups = payload?.squad?.squad;
  if (!Array.isArray(groups)) return [];

  const players = [];
  for (const group of groups) {
    for (const member of group.members || []) {
      if (member.ccode !== "MAR") continue;
      if (member.role?.key === "coach") continue;
      players.push({
        id: member.id,
        name: member.name,
        shirtNumber: member.shirtNumber,
        position: group.title,
        injured: Boolean(member.injured),
      });
    }
  }
  return players;
}

export async function mapInChunks(items, concurrency, mapper) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    results.push(...(await Promise.all(chunk.map(mapper))));
  }
  return results;
}
