import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Loader from "../../layouts/loader/Loader";
import { teamLogo } from "../../helpers/media.helpers";
import styles from "./GameDetail.module.scss";
import { getFixtureDetail } from "../../api/football/services/fixtureDetailService";

const TABS = ["summary", "feed", "lineups", "standings", "h2h"];

const queryRetry = (failureCount, error) => {
  const status = error?.response?.status;
  if (status === 404 || status === 403 || status === 401) return false;
  return failureCount < 2;
};

const formatKickoff = (timestamp) => {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const safe = (v, fallback = "—") => v ?? fallback;

function flattenStatistics(statsPayload) {
  const periods = statsPayload?.statistics;
  if (!Array.isArray(periods)) return [];
  const block =
    periods.find((p) => p?.period === "ALL") ??
    periods.find((p) => !p?.period) ??
    periods[0];
  if (!block?.groups) return [];

  const rows = [];
  for (const g of block.groups) {
    const items = g?.statisticsItems;
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      if (!it?.name) continue;
      rows.push({
        name: it.name,
        home: it.home ?? it.homeValue,
        away: it.away ?? it.awayValue,
      });
    }
  }
  return rows;
}

function findStatRow(rows, needles) {
  const l = needles.map((n) => n.toLowerCase());
  return (
    rows.find((r) => {
      const name = String(r.name).toLowerCase();
      return l.some((n) => name.includes(n));
    }) ?? null
  );
}

function parseNumericStat(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/%/g, "").replace(",", ".").trim();
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parsePossessionPct(value) {
  const n = parseNumericStat(value);
  if (n == null || n <= 0) return null;
  return n <= 1 ? Math.round(n * 100) : Math.round(Math.min(n, 100));
}

function formatGoalMinute(inc) {
  const base = inc.time ?? 0;
  const extra = inc.addedTime ?? 0;
  if (extra > 0) return `${base}+${extra}'`;
  return `${base}'`;
}

function isPenaltyGoal(inc) {
  return String(inc.detail ?? "")
    .toLowerCase()
    .includes("pen");
}

function playerLastName(player) {
  const name = player?.shortName || player?.name || "?";
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function groupScorersBySide(timeline, isHome) {
  const filtered = timeline.filter((g) => g.isHome === isHome);
  const byPlayer = new Map();

  for (const goal of filtered) {
    const name = playerLastName(goal.player);
    const minute = formatGoalMinute(goal);
    const suffix = isPenaltyGoal(goal) ? " (Pen)" : "";
    const entry = `${minute}${suffix}`;
    if (!byPlayer.has(name)) byPlayer.set(name, []);
    byPlayer.get(name).push(entry);
  }

  return Array.from(byPlayer.entries()).map(
    ([name, minutes]) => `${name} ${minutes.join(", ")}`,
  );
}

function buildGoalEventsWithHalftime(goals, htHome, htAway) {
  const sorted = [...goals].sort(
    (a, b) => Number(a.time ?? 0) - Number(b.time ?? 0),
  );
  const items = [];
  let htInserted = htHome == null;

  for (const goal of sorted) {
    if (!htInserted && Number(goal.time ?? 0) > 45) {
      items.push({ kind: "halftime", home: htHome, away: htAway });
      htInserted = true;
    }
    items.push({ kind: "goal", ...goal });
  }

  return items;
}

function summarizeIncidents(raw, homeTeamId, awayTeamId) {
  const incidents = Array.isArray(raw?.incidents) ? raw.incidents : [];
  const sorted = [...incidents].sort(
    (a, b) =>
      Number(a.timeSeconds ?? a.time ?? 0) - Number(b.timeSeconds ?? b.time ?? 0),
  );

  const sideOf = (inc) => {
    if (inc.isHome === true) return "home";
    if (inc.isHome === false) return "away";
    const pid = inc.teamId;
    if (pid != null && homeTeamId != null && Number(pid) === Number(homeTeamId))
      return "home";
    if (pid != null && awayTeamId != null && Number(pid) === Number(awayTeamId))
      return "away";
    return null;
  };

  const timelineGoals = sorted.filter((i) => i.incidentType === "goal");

  return {
    all: sorted,
    timeline: timelineGoals,
  };
}

function incidentLabel(inc, t) {
  const type = inc.incidentType ?? inc.type;
  const player = inc.player?.shortName || inc.player?.name || t("common.dash");

  if (type === "goal") {
    const pen = isPenaltyGoal(inc) ? ` ${t("gameDetail.penaltyShort")}` : "";
    return `${player}${pen}`;
  }
  if (type === "card") {
    const card =
      inc.incidentClass === "red"
        ? t("gameDetail.redCard")
        : t("gameDetail.yellowCard");
    return `${player} · ${card}`;
  }
  if (type === "substitution") {
    return `${player} · ${t("gameDetail.substitution")}`;
  }
  return player;
}

function StatBars({
  label,
  homeLabel,
  awayLabel,
  homePct,
  homeDisplay,
  awayDisplay,
}) {
  if (homePct == null) return null;
  const h = Math.max(0, Math.min(100, homePct));

  return (
    <div className={styles.statBarBlock}>
      <div className={styles.statBarHeader}>
        <span className={styles.statSideShort}>{homeLabel}</span>
        <span className={styles.statBarTitle}>{label}</span>
        <span className={styles.statSideShort}>{awayLabel}</span>
      </div>
      <div className={styles.statBarValues}>
        <span>{safe(homeDisplay)}</span>
        <span>{safe(awayDisplay)}</span>
      </div>
      <div className={styles.statBarTrack}>
        <div
          className={styles.statBarFillHome}
          style={{
            width: `${h}%`,
            background: "linear-gradient(90deg, #1e4d8caa 0%, #1e4d8c 100%)",
          }}
        />
        <div
          className={styles.statBarFillAway}
          style={{
            width: `${100 - h}%`,
            background: "linear-gradient(270deg, #28a865aa 0%, #28a865 100%)",
          }}
        />
      </div>
    </div>
  );
}

function EventsCard({ title, items, halfTimePrefix }) {
  if (!items.length) return null;

  return (
    <div className={styles.contentCard}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <ul className={styles.eventsList}>
        {items.map((item, idx) => {
          if (item.kind === "halftime") {
            return (
              <li key={`ht-${idx}`} className={styles.halftimeRow}>
                {halfTimePrefix}
                {item.home} - {item.away}
              </li>
            );
          }

          const who =
            item.player?.shortName || item.player?.name || "—";
          const score =
            item.homeScore != null && item.awayScore != null
              ? ` (${item.homeScore} - ${item.awayScore})`
              : "";

          return (
            <li key={`${idx}-${item.time}-${who}`} className={styles.eventRow}>
              <span className={styles.eventBody}>
                {who}
                <span className={styles.eventScore}>{score}</span>
              </span>
              <i className={`fi fi-rr-football ${styles.eventIcon}`} />
              <span className={styles.eventMinute}>
                {formatGoalMinute(item)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LineupsPanel({ lineups, event, t }) {
  const home = lineups?.home;
  const away = lineups?.away;
  const hasLineups =
    (home?.players?.length ?? 0) > 0 || (away?.players?.length ?? 0) > 0;

  if (!hasLineups) {
    return (
      <div className={styles.contentCard}>
        <p className={styles.emptyTab}>{t("gameDetail.lineupsEmpty")}</p>
      </div>
    );
  }

  const renderSide = (side, team) => (
    <div className={styles.lineupBlock}>
      <div className={styles.lineupHeader}>
        <img
          src={teamLogo(team)}
          alt=""
          className={styles.lineupTeamLogo}
          loading="lazy"
        />
        <span className={styles.lineupTeamName}>{team?.name}</span>
        {side?.formation ? (
          <span className={styles.lineupFormation}>{side.formation}</span>
        ) : null}
      </div>
      <ul className={styles.lineupPlayers}>
        {(side?.players ?? []).map((row) => (
          <li
            key={row.player?.id ?? row.player?.name}
            className={styles.lineupPlayer}
          >
            <span className={styles.lineupNumber}>
              {row.player?.number ?? "—"}
            </span>
            <span>{row.player?.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={styles.contentCard}>
      <div className={styles.lineupsGrid}>
        {renderSide(home, event.homeTeam)}
        {renderSide(away, event.awayTeam)}
      </div>
    </div>
  );
}

function FeedPanel({ incidents, t }) {
  if (!incidents.length) {
    return (
      <div className={styles.contentCard}>
        <p className={styles.emptyTab}>{t("gameDetail.feedEmpty")}</p>
      </div>
    );
  }

  return (
    <div className={styles.contentCard}>
      <ul className={styles.feedList}>
        {incidents.map((inc, idx) => (
          <li key={`${idx}-${inc.time}-${inc.incidentType}`} className={styles.feedItem}>
            <span className={styles.feedMinute}>{formatGoalMinute(inc)}</span>
            <div className={styles.feedBody}>
              {incidentLabel(inc, t)}
              {inc.homeScore != null && inc.awayScore != null ? (
                <p className={styles.feedMeta}>
                  {inc.homeScore} - {inc.awayScore}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatsPanel({
  event,
  possession,
  possHomeKnown,
  shotsTotal,
  shotsOn,
  xg,
  t,
}) {
  const statsPanelReady =
    (possession && possHomeKnown != null) || shotsTotal;

  if (!statsPanelReady) return null;

  return (
    <div className={styles.contentCard}>
      <h3 className={styles.statsTitle}>{t("gameDetail.statsSummary")}</h3>
      {possession != null && possHomeKnown != null && (
        <StatBars
          label={t("gameDetail.possession")}
          homeLabel={event.homeTeam?.shortName ?? t("gameDetail.home")}
          awayLabel={event.awayTeam?.shortName ?? t("gameDetail.away")}
          homePct={possHomeKnown}
          homeDisplay={possession.home ?? "—"}
          awayDisplay={possession.away ?? "—"}
        />
      )}
      {shotsTotal && (
        <div className={styles.dualNumRow}>
          <div className={styles.dualNum}>
            <span className={styles.dualLabel}>
              {t("gameDetail.shotsTotal")}
            </span>
            <strong>
              {shotsTotal.home} – {shotsTotal.away}
            </strong>
          </div>
          {shotsOn && (
            <div className={styles.dualNum}>
              <span className={styles.dualLabel}>
                {t("gameDetail.shotsOnTarget")}
              </span>
              <strong>
                {shotsOn.home} – {shotsOn.away}
              </strong>
            </div>
          )}
          {xg && (
            <div className={styles.dualNum}>
              <span className={styles.dualLabel}>{t("gameDetail.xg")}</span>
              <strong>
                {xg.home} – {xg.away}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GameDetail() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState("summary");

  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fixture-detail", eventId],
    queryFn: () => getFixtureDetail(eventId),
    enabled: Boolean(eventId),
    retry: queryRetry,
    staleTime: 30_000,
  });

  if (isLoading) return <Loader />;

  const event = detail?.event;

  if (isError || !event) {
    return (
      <section className={styles.page}>
        <div className={styles.errorCard}>
          <Link className={styles.backLabel} to="/">
            ← {t("gameDetail.matches")}
          </Link>
          <p className={styles.error}>
            {error?.message || t("gameDetail.errorLoad")}
          </p>
        </div>
      </section>
    );
  }

  const statusType = event.status?.type;
  const isLive = statusType === "inprogress";
  const isFinished = statusType === "finished";
  const notStarted = statusType === "notstarted";

  const homeScore =
    isFinished || isLive ? event.homeScore?.display ?? null : null;
  const awayScore =
    isFinished || isLive ? event.awayScore?.display ?? null : null;

  const statRows = flattenStatistics(detail.statistics ?? null);
  const possession = findStatRow(statRows, ["Ball possession", "possession"]);
  const homePoss = possession ? parsePossessionPct(possession.home) : null;
  const awayPoss = possession ? parsePossessionPct(possession.away) : null;
  const possHomeKnown =
    homePoss != null ? homePoss : awayPoss != null ? 100 - awayPoss : null;

  const shotsTotal = findStatRow(statRows, ["total shots", "Total Shots"]);
  const shotsOn = findStatRow(statRows, ["shots on goal", "Shots on Goal"]);
  const xg = findStatRow(statRows, ["expected goals", "Expected Goals"]);

  const incSummary = summarizeIncidents(
    detail.incidents,
    event.homeTeam?.id,
    event.awayTeam?.id,
  );

  const homeScorers = groupScorersBySide(incSummary.timeline, true);
  const awayScorers = groupScorersBySide(incSummary.timeline, false);

  const htHome = event.homeScore?.period1;
  const htAway = event.awayScore?.period1;
  const goalEvents = buildGoalEventsWithHalftime(
    incSummary.timeline,
    htHome,
    htAway,
  );

  const tournamentLabel =
    [event.league?.round, event.tournament?.uniqueTournament?.name]
      .filter(Boolean)
      .join(" ") ||
    event.tournament?.name ||
    "—";

  const leagueLogoSrc =
    event.league?.logo ||
    (event.league?.id
      ? `https://media.api-sports.io/football/leagues/${event.league.id}.png`
      : null);

  const statusLabel = isLive
    ? event.status?.description || t("gameCard.live")
    : isFinished
      ? t("gameDetail.fullTime")
      : formatKickoff(event.startTimestamp);

  const tabLabels = {
    summary: t("gameDetail.tabSummary"),
    feed: t("gameDetail.tabFeed"),
    lineups: t("gameDetail.tabLineups"),
    standings: t("gameDetail.tabStandings"),
    h2h: t("gameDetail.tabH2h"),
  };

  return (
    <section className={styles.page}>
      <div className={styles.matchCard}>
        <div className={styles.topNav}>
          <div className={styles.navLeft}>
            <Link to="/" className={styles.backBtn} aria-label={t("common.back")}>
              <i className="fi fi-rr-angle-small-left" />
            </Link>
            <Link to="/" className={styles.backLabel}>
              {t("gameDetail.matches")}
            </Link>
          </div>

          <div className={styles.tournamentCenter}>
            {leagueLogoSrc ? (
              <img
                src={leagueLogoSrc}
                alt=""
                className={styles.tournamentLogo}
                loading="lazy"
              />
            ) : null}
            <span className={styles.tournamentName}>{tournamentLabel}</span>
          </div>

          <button type="button" className={styles.followBtn}>
            {t("gameDetail.follow")}
          </button>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <i className="fi fi-rr-calendar" />
            {formatKickoff(event.startTimestamp)}
          </span>
          {event.venue?.name ? (
            <span className={styles.metaItem}>
              <i className="fi fi-rr-marker" />
              {event.venue.name}
            </span>
          ) : null}
          {event.referee?.name ? (
            <span className={styles.metaItem}>
              <i className="fi fi-rr-whistle" />
              {event.referee.name}
            </span>
          ) : null}
        </div>

        <div className={styles.scoreboard}>
          <div className={`${styles.teamSide} ${styles.teamHome}`}>
            <span className={styles.teamName}>{event.homeTeam?.name}</span>
            <img
              src={teamLogo(event.homeTeam)}
              alt=""
              className={styles.teamLogo}
              loading="lazy"
            />
          </div>

          <div className={styles.scoreCenter}>
            {homeScore != null ? (
              <p className={styles.scoreLine}>
                {homeScore} - {awayScore}
              </p>
            ) : (
              <p className={styles.vsLine}>{t("common.vs")}</p>
            )}
            <p
              className={`${styles.statusLabel} ${isLive ? styles.statusLive : ""}`}
            >
              {statusLabel}
            </p>
          </div>

          <div className={`${styles.teamSide} ${styles.teamAway}`}>
            <img
              src={teamLogo(event.awayTeam)}
              alt=""
              className={styles.teamLogo}
              loading="lazy"
            />
            <span className={styles.teamName}>{event.awayTeam?.name}</span>
          </div>
        </div>

        {(homeScorers.length > 0 || awayScorers.length > 0) && (
          <div className={styles.scorersRow}>
            <div className={`${styles.scorersSide} ${styles.scorersHome}`}>
              {homeScorers.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <i className={`fi fi-rr-football ${styles.scorersIcon}`} />
            <div className={`${styles.scorersSide} ${styles.scorersAway}`}>
              {awayScorers.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.tabList} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "summary" && (
        <>
          <EventsCard
            title={t("gameDetail.events")}
            items={goalEvents}
            halfTimePrefix={t("gameDetail.halfTimePrefix")}
          />
          {!notStarted && (
            <StatsPanel
              event={event}
              possession={possession}
              possHomeKnown={possHomeKnown}
              shotsTotal={shotsTotal}
              shotsOn={shotsOn}
              xg={xg}
              t={t}
            />
          )}
        </>
      )}

      {activeTab === "feed" && (
        <FeedPanel incidents={incSummary.all} t={t} />
      )}

      {activeTab === "lineups" && (
        <LineupsPanel lineups={detail.lineups} event={event} t={t} />
      )}

      {(activeTab === "standings" || activeTab === "h2h") && (
        <div className={styles.contentCard}>
          <p className={styles.emptyTab}>{t("gameDetail.comingSoon")}</p>
        </div>
      )}
    </section>
  );
}
