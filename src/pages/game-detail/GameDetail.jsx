import { Link, useParams } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getSofascoreApiV1Base } from "../../api/sofascoreBase";
import Loader from "../../layouts/loader/Loader";
import Team from "../../components/team/Team";
import { palette } from "../../themes/palette";
import styles from "./GameDetail.module.scss";

const baseReq = () => getSofascoreApiV1Base();

const fetchEvent = async (eventId) => {
  const { data } = await axios.get(`${baseReq()}/event/${eventId}`);
  return data?.event ?? null;
};

const fetchEventStatistics = async (eventId) => {
  const { data } = await axios.get(`${baseReq()}/event/${eventId}/statistics`);
  return data ?? null;
};

const fetchIncidentList = async (eventId) => {
  const { data } = await axios.get(`${baseReq()}/event/${eventId}/incidents`);
  return data ?? null;
};

const fetchLineups = async (eventId) => {
  const { data } = await axios.get(`${baseReq()}/event/${eventId}/lineups`);
  return data ?? null;
};

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

function formatCompact(n) {
  if (n == null || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(n));
  } catch {
    return String(Math.round(n));
  }
}

function flattenStatistics(statsPayload) {
  const periods = statsPayload?.statistics;
  if (!Array.isArray(periods)) return [];
  const block =
    periods.find((p) => p?.period === "ALL") ??
    periods.find((p) => !p?.period) ??
    periods[0];
  if (!block?.groups) return [];

  /** @type {Array<{ name: string; home: unknown; away: unknown; homeValue?: unknown; awayValue?: unknown }>} */
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
  const match = rows.find((r) => {
    const name = String(r.name).toLowerCase();
    return l.some((n) => name.includes(n));
  });
  return match ?? null;
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
  const incidents = Array.isArray(raw?.incidents)
    ? raw.incidents
    : Array.isArray(raw)
      ? raw
      : [];
  const sorted = [...incidents].sort(
    (a, b) =>
      Number(a.timeSeconds ?? a.time ?? 0) - Number(b.timeSeconds ?? b.time ?? 0)
  );

  let yellowHome = 0;
  let yellowAway = 0;
  let redHome = 0;
  let redAway = 0;
  let subsHome = 0;
  let subsAway = 0;

  const sideOf = (inc) => {
    if (typeof inc.isHome === "boolean") return inc.isHome ? "home" : "away";
    if (inc.team === "home") return "home";
    if (inc.team === "away") return "away";
    const pid = inc.playerTeam?.id ?? inc.participant?.id ?? inc.teamId;
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
      const klass = inc.incidentClass ?? inc.card ?? "";
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

  const timelineGoals = sorted.filter(
    (i) =>
      i.incidentType === "goal" ||
      i.incidentType === "ownGoal" ||
      i.incidentClass === "ownGoal"
  );

  return {
    yellowHome,
    yellowAway,
    redHome,
    redAway,
    subsHome,
    subsAway,
    timeline: timelineGoals.sort(
      (a, b) =>
        Number(a.timeSeconds ?? a.time ?? 0) -
        Number(b.timeSeconds ?? b.time ?? 0)
    ),
  };
}

function winnerLabel(event) {
  const code = event.winnerCode;
  if (code === 1) return event.homeTeam?.shortName ?? event.homeTeam?.name;
  if (code === 2) return event.awayTeam?.shortName ?? event.awayTeam?.name;
  if (code === 3 || code === 0) return "Match nul";
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
  if (homePct == null || homePct === undefined) return null;
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
    data: event,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["sofa-event", eventId],
    queryFn: () => fetchEvent(eventId),
    enabled: Boolean(eventId),
  });

  const extraResults = useQueries({
    queries: [
      {
        queryKey: ["sofa-event-statistics", eventId],
        queryFn: () => fetchEventStatistics(eventId),
        enabled: Boolean(eventId),
        retry: queryRetry,
      },
      {
        queryKey: ["sofa-event-incidents", eventId],
        queryFn: () => fetchIncidentList(eventId),
        enabled: Boolean(eventId),
        retry: queryRetry,
      },
      {
        queryKey: ["sofa-event-lineups", eventId],
        queryFn: () => fetchLineups(eventId),
        enabled: Boolean(eventId),
        retry: queryRetry,
      },
    ],
  });

  const [statsQuery, incidentsQuery, lineupsQuery] = extraResults;

  if (isLoading) return <Loader />;

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

  const stadiumCapacity = event.venue?.capacity;
  const referee = event.referee;

  const avgCards =
    referee?.games > 0
      ? ((referee.yellowCards + referee.redCards) / referee.games).toFixed(2)
      : null;

  const injuryTotal =
    (event.time?.injuryTime1 || 0) + (event.time?.injuryTime2 || 0);

  const homePopularity = event.homeTeam?.userCount;
  const awayPopularity = event.awayTeam?.userCount;

  const popTotal =
    Number(homePopularity || 0) + Number(awayPopularity || 0);
  const homePopShare =
    popTotal > 0
      ? Math.round((Number(homePopularity || 0) / popTotal) * 100)
      : 50;

  const statRows = flattenStatistics(statsQuery.data ?? null);
  const possession = findStatRow(statRows, [
    "Ball possession",
    "possession",
  ]);
  const homePoss = possession ? parsePossessionPct(possession.home) : null;
  const awayPoss = possession ? parsePossessionPct(possession.away) : null;
  const possHomeKnown =
    homePoss != null
      ? homePoss
      : awayPoss != null
        ? 100 - awayPoss
        : null;

  const shotsTotal = findStatRow(statRows, [
    "total shots",
    "total shot",
    "shots",
    "shooting",
    "frappes totales",
  ]);
  const shotsOn = findStatRow(statRows, [
    "shot on goal",
    "shots on goal",
    "shots on target",
    "cadrés",
    "cadré",
    "cadrés ",
  ]);

  const corners = findStatRow(statRows, ["corner", "corners"]);
  const xg = findStatRow(statRows, ["expected goals", "xg", "xG"]);
  const offsides = findStatRow(statRows, ["offside", "offsides"]);
  const fouls = findStatRow(statRows, ["foul", "fouls"]);

  const incSummary = summarizeIncidents(
    incidentsQuery.data,
    event.homeTeam?.id,
    event.awayTeam?.id
  );

  const winText = isFinished ? winnerLabel(event) : null;

  const homeColor =
    event.homeTeam?.teamColors?.primary || palette.blue.main;
  const awayColor =
    event.awayTeam?.teamColors?.primary || palette.gray.main;

  const categoryName = event.tournament?.category?.name;

  const statsPanelReady =
    (possession && possHomeKnown != null) || shotsTotal || corners;

  return (
    <section className={styles.page}>
      <Link className={styles.back} to="/">
        ← Retour
      </Link>

      <header
        className={styles.hero}
        style={{
          borderBottom: "2px solid transparent",
          borderImage: `linear-gradient(90deg, ${homeColor}99, transparent 42%, ${awayColor}99) 1`,
        }}
      >
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
          <span className={styles.dot}>·</span>
          <span>Journée {event.roundInfo?.round}</span>
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

      <div
        className={styles.scoreboard}
        style={{
          boxShadow: `inset 0 0 0 1px ${homeColor}22, 0 12px 40px #0006`,
        }}
      >
        <div className={styles.side}>
          <span
            className={styles.colorDot}
            style={{ backgroundColor: homeColor }}
            aria-hidden
          />
          <Team team={event.homeTeam} fromGame />
          <p className={styles.teamFull}>{event.homeTeam?.name}</p>
          <p className={styles.nameCode}>{event.homeTeam?.nameCode}</p>
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

          {(isFinished || isLive) && (
            <>
              <p className={styles.half}>
                MT {event.homeScore?.period1}–{event.awayScore?.period1}
              </p>
              <p className={styles.mutedSmall}>
                Régulier {event.homeScore?.normaltime}–
                {event.awayScore?.normaltime}
                {event.homeScore?.overtime != null && (
                  <>
                    {" "}
                    · Prolongations {event.homeScore?.overtime}–
                    {event.awayScore?.overtime}
                  </>
                )}
              </p>
            </>
          )}

          <FormationLineups lineupsPayload={lineupsQuery.data} />
        </div>

        <div className={styles.side}>
          <span
            className={styles.colorDot}
            style={{ backgroundColor: awayColor }}
            aria-hidden
          />
          <Team team={event.awayTeam} fromGame />
          <p className={styles.teamFull}>{event.awayTeam?.name}</p>
          <p className={styles.nameCode}>{event.awayTeam?.nameCode}</p>
        </div>
      </div>

      <div className={styles.sectionTitleRow}>
        <h2 className={styles.sectionTitle}>Indicateurs clés</h2>
        {statsQuery.isFetching && (
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
                {goalDiff == null ? "—" : goalDiff > 0 ? `+${goalDiff}` : goalDiff}
              </p>
            </div>
          </>
        )}

        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Temps additionnel</p>
          <p className={styles.kpiValue}>{injuryTotal} min</p>
        </div>

        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Arbitre (moy.)</p>
          <p className={styles.kpiValue}>
            {avgCards != null ? `${avgCards} cartons / match` : "—"}
          </p>
        </div>

        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Intérêt SofaScore</p>
          <p className={styles.kpiValue}>
            {formatCompact(homePopularity)} vs {formatCompact(awayPopularity)}
          </p>
          <div className={styles.miniBarTrack}>
            <div
              className={styles.miniBarSegment}
              style={{
                width: `${homePopShare}%`,
                backgroundColor: homeColor,
              }}
            />
            <div
              className={styles.miniBarSegment}
              style={{
                width: `${100 - homePopShare}%`,
                backgroundColor: awayColor,
              }}
            />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Stade (cap.)</p>
          <p className={styles.kpiValue}>
            {stadiumCapacity
              ? `${stadiumCapacity.toLocaleString()} places`
              : "—"}
          </p>
        </div>

        {(isFinished || isLive) && (
          <>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Cartons (feu)</p>
              <p className={styles.kpiValue}>
                {incidentsQuery.isLoading ? (
                  "…"
                ) : (
                  <>
                    🟨 {incSummary.yellowHome}–{incSummary.yellowAway} · 🟥{" "}
                    {incSummary.redHome}–{incSummary.redAway}
                  </>
                )}
              </p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Remplacements</p>
              <p className={styles.kpiValue}>
                {incidentsQuery.isLoading
                  ? "…"
                  : `${incSummary.subsHome} – ${incSummary.subsAway}`}
              </p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Tirs (tot. / cadrés)</p>
              <p className={styles.kpiValue}>
                {statsQuery.isLoading ? (
                  "…"
                ) : shotsTotal ? (
                  <>
                    {event.homeTeam?.shortName ?? "Loc."}{" "}
                    {shotsTotal.home}/{shotsOn ? shotsOn.home : "—"} ·{" "}
                    {event.awayTeam?.shortName ?? "Vis."}{" "}
                    {shotsTotal.away}/{shotsOn ? shotsOn.away : "—"}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Corners · Hors-jeux</p>
              <p className={styles.kpiValue}>
                {statsQuery.isLoading ? (
                  "…"
                ) : corners || offsides ? (
                  <>
                    {corners ? (
                      <>
                        C {corners.home}–{corners.away}{" "}
                      </>
                    ) : (
                      ""
                    )}
                    {offsides ? <>· H-J {offsides.home}–{offsides.away}</> : null}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Fautes signalées</p>
              <p className={styles.kpiValue}>
                {statsQuery.isLoading
                  ? "…"
                  : fouls
                    ? `${String(fouls.home)} – ${String(fouls.away)}`
                    : "—"}
              </p>
            </div>
          </>
        )}
      </div>

      {(isFinished || isLive) && !statsQuery.isError && statsPanelReady && (
          <div className={styles.statsPanel}>
            <h3 className={styles.sectionTitleMuted}>Synthèse chiffrée</h3>

            {possession != null && possHomeKnown != null ? (
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
            ) : null}

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
                    <span className={styles.dualLabel}>xG estimé</span>
                    <strong>
                      {xg.home} – {xg.away}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {corners && (
              <StatBars
                label="Corners"
                homeLabel={event.homeTeam?.shortName ?? "Loc."}
                awayLabel={event.awayTeam?.shortName ?? "Vis."}
                homeBarColor={homeColor}
                awayBarColor={awayColor}
                homePct={(() => {
                  const h = parseNumericStat(corners.home);
                  const a = parseNumericStat(corners.away);
                  if (h == null || a == null) return null;
                  const sum = h + a;
                  if (sum <= 0) return 50;
                  return Math.round((h / sum) * 100);
                })()}
                homeDisplay={corners.home}
                awayDisplay={corners.away}
              />
            )}
          </div>
        )}

      {(isFinished || isLive) &&
        incSummary.timeline?.length > 0 &&
        !incidentsQuery.isLoading && (
          <div className={styles.timelinePanel}>
            <h3 className={styles.sectionTitleMuted}>Fil des buts</h3>
            <ul className={styles.timelineList}>
              {incSummary.timeline.map((inc, idx) => {
                const mins = `${inc.time ?? ""}'${inc.addedTime ? "+" + inc.addedTime : ""}`;
                const isOg = inc.incidentClass === "ownGoal";
                const who =
                  inc.player?.shortName || inc.player?.name || inc.text || "Év.";
                const assist = inc.assist1?.shortName || inc.assist1?.name;
                return (
                  <li key={`${idx}-${inc.time}-${who}`}>
                    <span className={styles.tlMinute}>{mins}</span>
                    <span className={styles.tlBody}>
                      <strong>{isOg ? "(csc) " : ""}</strong>
                      {who}
                      {assist ? (
                        <span className={styles.tlAssist}> ({assist})</span>
                      ) : null}
                    </span>
                    <span className={styles.tlScoreMuted}>
                      {inc.homeScore}–{inc.awayScore}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      <div className={styles.sectionTitleRow}>
        <h2 className={styles.sectionTitle}>Contexte du match</h2>
      </div>

      <div className={styles.detailsGrid}>
        {event.venue?.name && (
          <div className={styles.detail}>
            <h3>Stade</h3>
            <p>{event.venue.name}</p>
            <p className={styles.muted}>{event.venue.city?.name}</p>
            {event.venue.venueCoordinates?.latitude != null && (
              <p className={styles.muted}>
                Coord. · {event.venue.venueCoordinates.latitude},{" "}
                {event.venue.venueCoordinates.longitude}
              </p>
            )}
            {event.venue.capacity && (
              <p className={styles.tagLine}>
                {event.venue.capacity.toLocaleString()} places
              </p>
            )}
          </div>
        )}

        {referee?.name && (
          <div className={styles.detail}>
            <h3>Arbitrage</h3>
            <p>{referee.name}</p>
            <p className={styles.muted}>
              {referee.games} matchs officiels · 🟨 {referee.yellowCards} · 🟥{" "}
              {referee.redCards}
            </p>
            {avgCards != null && (
              <p className={styles.tagLine}>{avgCards} cartons par match</p>
            )}
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

        {event.customId && (
          <div className={styles.detail}>
            <h3>Réf. SofaScore</h3>
            <p>{event.customId}</p>
            <p className={styles.muted}>ID événement {event.id}</p>
          </div>
        )}
      </div>

      <div className={styles.insights}>
        <h3>Couverture & données</h3>
        <div className={styles.chipGrid}>
          <span className={`${styles.chip} ${event.hasXg ? styles.chipOn : styles.chipOff}`}>
            xG {event.hasXg ? "disponibles" : "non dispo."}
          </span>
          <span
            className={`${styles.chip} ${event.hasEventPlayerStatistics ? styles.chipOn : styles.chipOff}`}
          >
            Stats joueurs {event.hasEventPlayerStatistics ? "" : "(non détaillées)"}
          </span>
          <span
            className={`${styles.chip} ${event.hasEventPlayerHeatMap ? styles.chipOn : styles.chipOff}`}
          >
            Heatmap {event.hasEventPlayerHeatMap ? "oui" : "non"}
          </span>
          {event.hasGlobalHighlights !== undefined ? (
            <span
              className={`${styles.chip} ${event.hasGlobalHighlights ? styles.chipOn : styles.chipOff}`}
            >
              Résumés / highlights globaux{" "}
              {event.hasGlobalHighlights ? "oui" : "non"}
            </span>
          ) : null}
          <span className={styles.chip}>{event.status?.type}</span>
        </div>

        {(statsQuery.isError ||
          incidentsQuery.isError ||
          lineupsQuery.isError) && (
          <p className={styles.partialNote}>
            Certaines couches (stats, compositions ou événements) n’ont pu être
            chargées — données partielles.
          </p>
        )}
      </div>
    </section>
  );
}
