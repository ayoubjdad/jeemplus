import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Loader from "../../layouts/loader/Loader";
import Team from "../../components/team/Team";
import { palette } from "../../themes/palette";
import styles from "./GameDetail.module.scss";
import { getFixtureDetail } from "../../api/football/services/fixtureDetailService";

const queryRetry = (failureCount, error) => {
  const status = error?.response?.status;
  if (status === 404 || status === 403 || status === 401) return false;
  return failureCount < 2;
};

const formatKickoff = (timestamp) => {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
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
        homeValue: it.homeValue,
        awayValue: it.awayValue,
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

function summarizeIncidents(raw, homeTeamId, awayTeamId) {
  const incidents = Array.isArray(raw?.incidents) ? raw.incidents : [];
  const sorted = [...incidents].sort(
    (a, b) =>
      Number(a.timeSeconds ?? a.time ?? 0) - Number(b.timeSeconds ?? b.time ?? 0),
  );

  let yellowHome = 0;
  let yellowAway = 0;
  let redHome = 0;
  let redAway = 0;
  let subsHome = 0;
  let subsAway = 0;

  const sideOf = (inc) => {
    const pid = inc.teamId;
    if (pid != null && homeTeamId != null && Number(pid) === Number(homeTeamId))
      return "home";
    if (pid != null && awayTeamId != null && Number(pid) === Number(awayTeamId))
      return "away";
    return null;
  };

  for (const inc of sorted) {
    const t = inc.incidentType ?? inc.type;
    if (t === "card") {
      const side = sideOf(inc);
      const klass = inc.incidentClass ?? "";
      if (side === "home") {
        if (klass === "yellow" || klass === "yellowRed") yellowHome++;
        if (klass === "red") redHome++;
      } else if (side === "away") {
        if (klass === "yellow" || klass === "yellowRed") yellowAway++;
        if (klass === "red") redAway++;
      }
    }
    if (t === "substitution") {
      const side = sideOf(inc);
      if (side === "home") subsHome++;
      else if (side === "away") subsAway++;
    }
  }

  const timelineGoals = sorted.filter((i) => i.incidentType === "goal");

  return {
    yellowHome,
    yellowAway,
    redHome,
    redAway,
    subsHome,
    subsAway,
    timeline: timelineGoals,
  };
}

function winnerLabel(event) {
  const code = event.winnerCode;
  if (code === 1) return event.homeTeam?.shortName ?? event.homeTeam?.name;
  if (code === 2) return event.awayTeam?.shortName ?? event.awayTeam?.name;
  if (code === 3) return "Match nul";
  return null;
}

function FormationLineups({ lineupsPayload }) {
  const fh = lineupsPayload?.home?.formation;
  const fa = lineupsPayload?.away?.formation;
  if (!fh && !fa) return null;
  return (
    <div className={styles.formationStrip}>
      <span className={styles.formation}>{fh || "?"}</span>
      <span className={styles.formationMuted}>formation</span>
      <span className={styles.formation}>{fa || "?"}</span>
    </div>
  );
}

function StatBars({
  label,
  homeLabel,
  awayLabel,
  homePct,
  homeDisplay,
  awayDisplay,
  homeBarColor,
  awayBarColor,
}) {
  if (homePct == null) return null;
  const h = Math.max(0, Math.min(100, homePct));
  const hc = homeBarColor ?? "#23c6f3";
  const ac = awayBarColor ?? "#9b86c9";
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
            background: `linear-gradient(90deg, ${hc}aa 0%, ${hc} 100%)`,
          }}
        />
        <div
          className={styles.statBarFillAway}
          style={{
            width: `${100 - h}%`,
            background: `linear-gradient(270deg, ${ac}aa 0%, ${ac} 100%)`,
          }}
        />
      </div>
    </div>
  );
}

export default function GameDetail() {
  const { eventId } = useParams();

  const {
    data: detail,
    isLoading,
    isError,
    error,
    isFetching,
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
        <Link className={styles.back} to="/">
          ← Retour
        </Link>
        <p className={styles.error}>
          {error?.message || "Impossible de charger ce match."}
        </p>
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

  const totalGoals =
    homeScore != null && awayScore != null ? homeScore + awayScore : null;
  const goalDiff =
    homeScore != null && awayScore != null ? homeScore - awayScore : null;

  const homeColor = palette.blue.main;
  const awayColor = palette.gray.main;
  const categoryName = event.tournament?.category?.name;

  const statRows = flattenStatistics(detail.statistics ?? null);
  const possession = findStatRow(statRows, ["Ball possession", "possession"]);
  const homePoss = possession ? parsePossessionPct(possession.home) : null;
  const awayPoss = possession ? parsePossessionPct(possession.away) : null;
  const possHomeKnown =
    homePoss != null ? homePoss : awayPoss != null ? 100 - awayPoss : null;

  const shotsTotal = findStatRow(statRows, ["total shots", "Total Shots"]);
  const shotsOn = findStatRow(statRows, ["shots on goal", "Shots on Goal"]);
  const corners = findStatRow(statRows, ["corner", "Corner Kicks"]);
  const xg = findStatRow(statRows, ["expected goals", "Expected Goals"]);
  const offsides = findStatRow(statRows, ["offside", "Offsides"]);
  const fouls = findStatRow(statRows, ["foul", "Fouls"]);

  const incSummary = summarizeIncidents(
    detail.incidents,
    event.homeTeam?.id,
    event.awayTeam?.id,
  );

  const winText = isFinished ? winnerLabel(event) : null;
  const statsPanelReady =
    (possession && possHomeKnown != null) || shotsTotal || corners;

  return (
    <section className={styles.page}>
      <Link className={styles.back} to="/">
        ← Retour
      </Link>

      <header className={styles.hero}>
        <div className={styles.meta}>
          <span className={styles.tournament}>
            {event.tournament?.uniqueTournament?.name || event.tournament?.name}
          </span>
          {categoryName ? (
            <>
              <span className={styles.dot}>·</span>
              <span>{categoryName}</span>
            </>
          ) : null}
          <span className={styles.dot}>·</span>
          <span>{event.season?.name}</span>
          {event.roundInfo?.round ? (
            <>
              <span className={styles.dot}>·</span>
              <span>{event.roundInfo.round}</span>
            </>
          ) : null}
        </div>

        <div className={styles.statusRow}>
          <span
            className={styles.statusPill}
            style={{
              borderColor: isLive ? palette.red.main : palette.gray.main,
              color: isLive ? palette.red.main : palette.gray.main,
            }}
          >
            {event.status?.description}
          </span>
          <span className={styles.kickoff}>
            {formatKickoff(event.startTimestamp)}
          </span>
        </div>

        {winText && (
          <p className={styles.winnerBanner}>
            {winText === "Match nul" ? winText : `Vainqueur : ${winText}`}
          </p>
        )}
      </header>

      <div className={styles.scoreboard}>
        <div className={styles.side}>
          <Team team={event.homeTeam} fromGame />
          <p className={styles.teamFull}>{event.homeTeam?.name}</p>
        </div>

        <div className={styles.centerScore}>
          {homeScore != null ? (
            <p className={styles.scoreLine}>
              <span>{homeScore}</span>
              <span className={styles.scoreSep}>—</span>
              <span>{awayScore}</span>
            </p>
          ) : (
            <p className={styles.vs}>vs</p>
          )}

          {(isFinished || isLive) && event.homeScore?.period1 != null && (
            <p className={styles.half}>
              MT {event.homeScore.period1}–{event.awayScore.period1}
            </p>
          )}

          <FormationLineups lineupsPayload={detail.lineups} />
        </div>

        <div className={styles.side}>
          <Team team={event.awayTeam} fromGame />
          <p className={styles.teamFull}>{event.awayTeam?.name}</p>
        </div>
      </div>

      <div className={styles.sectionTitleRow}>
        <h2 className={styles.sectionTitle}>Indicateurs clés</h2>
        {isFetching && (
          <span className={styles.syncHint}>Mise à jour des stats…</span>
        )}
      </div>

      <div className={styles.kpiGrid}>
        {!notStarted && (
          <>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Total buts</p>
              <p className={styles.kpiValue}>{safe(totalGoals)}</p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Écart au score</p>
              <p className={styles.kpiValue}>
                {goalDiff == null
                  ? "—"
                  : goalDiff > 0
                    ? `+${goalDiff}`
                    : goalDiff}
              </p>
            </div>
          </>
        )}

        {(isFinished || isLive) && (
          <>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Cartons</p>
              <p className={styles.kpiValue}>
                🟨 {incSummary.yellowHome}–{incSummary.yellowAway} · 🟥{" "}
                {incSummary.redHome}–{incSummary.redAway}
              </p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Remplacements</p>
              <p className={styles.kpiValue}>
                {incSummary.subsHome} – {incSummary.subsAway}
              </p>
            </div>
          </>
        )}
      </div>

      {(isFinished || isLive) && statsPanelReady && (
        <div className={styles.statsPanel}>
          <h3 className={styles.sectionTitleMuted}>Synthèse chiffrée</h3>
          {possession != null && possHomeKnown != null && (
            <StatBars
              label="Possession"
              homeLabel={event.homeTeam?.shortName ?? "Loc."}
              awayLabel={event.awayTeam?.shortName ?? "Vis."}
              homePct={possHomeKnown}
              homeDisplay={possession.home ?? "—"}
              awayDisplay={possession.away ?? "—"}
              homeBarColor={homeColor}
              awayBarColor={awayColor}
            />
          )}
          {shotsTotal && (
            <div className={styles.dualNumRow}>
              <div className={styles.dualNum}>
                <span className={styles.dualLabel}>Tirs (total)</span>
                <strong>
                  {shotsTotal.home} – {shotsTotal.away}
                </strong>
              </div>
              {shotsOn && (
                <div className={styles.dualNum}>
                  <span className={styles.dualLabel}>Cadrés</span>
                  <strong>
                    {shotsOn.home} – {shotsOn.away}
                  </strong>
                </div>
              )}
              {xg && (
                <div className={styles.dualNum}>
                  <span className={styles.dualLabel}>xG</span>
                  <strong>
                    {xg.home} – {xg.away}
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {incSummary.timeline?.length > 0 && (
        <div className={styles.timelinePanel}>
          <h3 className={styles.sectionTitleMuted}>Fil des buts</h3>
          <ul className={styles.timelineList}>
            {incSummary.timeline.map((inc, idx) => {
              const mins = `${inc.time ?? ""}'`;
              const who = inc.player?.shortName || inc.player?.name || "Év.";
              return (
                <li key={`${idx}-${inc.time}-${who}`}>
                  <span className={styles.tlMinute}>{mins}</span>
                  <span className={styles.tlBody}>{who}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={styles.detailsGrid}>
        {event.venue?.name && (
          <div className={styles.detail}>
            <h3>Stade</h3>
            <p>{event.venue.name}</p>
            <p className={styles.muted}>{event.venue.city?.name}</p>
          </div>
        )}
        {event.referee?.name && (
          <div className={styles.detail}>
            <h3>Arbitrage</h3>
            <p>{event.referee.name}</p>
          </div>
        )}
        {event.homeTeam?.manager?.name && (
          <div className={styles.detail}>
            <h3>Entraîneur · {event.homeTeam.shortName}</h3>
            <p>{event.homeTeam.manager.name}</p>
          </div>
        )}
        {event.awayTeam?.manager?.name && (
          <div className={styles.detail}>
            <h3>Entraîneur · {event.awayTeam.shortName}</h3>
            <p>{event.awayTeam.manager.name}</p>
          </div>
        )}
      </div>
    </section>
  );
}
