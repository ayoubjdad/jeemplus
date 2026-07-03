import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import styles from "./League.module.scss";
import Loader from "../../layouts/loader/Loader";
import {
  resolveLeagueContext,
  getLeagueStandings,
  getLeagueFixtures,
  getLeaguePlayerStats,
  getLeagueTeamStats,
  getLeagueRounds,
} from "../../api/football/services/leagueService";
import { applyStandingsFilter } from "../../api/football/mappers/mapStandingRow";
import { formatSeasonLabel } from "../../api/football/leagueCatalog";
import { gamesFormatDate } from "../../helpers/global.helper";

const TAB_IDS = [
  "overview",
  "standings",
  "matches",
  //  "players", "teams"
];

const STANDINGS_FILTER_IDS = ["total", "home", "away"];

function getDateLocale(lng) {
  if (lng === "ar") return "ar-MA";
  if (lng === "en") return "en-GB";
  return "fr-FR";
}

function getQualificationBar(position, total) {
  if (position <= 4) return "ucl";
  if (position <= 6) return "uel";
  if (position >= total - 2) return "rel";
  return null;
}

function buildNextOpponentMap(fixtures) {
  const now = Date.now() / 1000;
  const upcoming = [...fixtures]
    .filter(
      (g) =>
        g.status?.type === "notstarted" ||
        (g.startTimestamp && g.startTimestamp > now)
    )
    .sort((a, b) => (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0));

  const map = {};
  for (const game of upcoming) {
    const homeId = game.homeTeam?.id;
    const awayId = game.awayTeam?.id;
    if (homeId && !map[homeId]) map[homeId] = game.awayTeam;
    if (awayId && !map[awayId]) map[awayId] = game.homeTeam;
  }
  return map;
}

function formatMatchTime(timestamp, locale) {
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function getScoreOrTime(game, locale) {
  if (
    game?.status?.type === "finished" ||
    game?.status?.type === "inprogress"
  ) {
    const home = game.homeScore.display ?? "-";
    const away = game.awayScore.display ?? "-";
    return `${home} - ${away}`;
  }
  return formatMatchTime(game.startTimestamp, locale);
}

function FormDots({ form }) {
  const { t } = useTranslation();
  const letters = (form ?? "").split("").slice(-5).reverse();
  if (!letters.length)
    return <span className={styles.stat}>{t("common.dash")}</span>;

  const labelFor = (letter) => {
    if (letter === "W") return t("league.formWin");
    if (letter === "D") return t("league.formDraw");
    return t("league.formLoss");
  };

  return (
    <div className={styles.formRow}>
      {letters.map((letter, idx) => {
        const cls =
          letter === "W"
            ? styles.formWin
            : letter === "D"
            ? styles.formDraw
            : styles.formLoss;

        return <span key={idx} className={`${styles.formDot} ${cls}`} />;
      })}
    </div>
  );
}

function ValueBadge({ value, variant }) {
  const cls =
    variant === "green"
      ? styles.valueBadgeGreen
      : variant === "red"
      ? styles.valueBadgeRed
      : "";
  return <span className={`${styles.valueBadge} ${cls}`}>{value}</span>;
}

function StandingsTable({ rows, nextOpponents = {}, showLegend = true }) {
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    return [...rows].sort((a, b) => a.position - b.position);
  }, [rows]);

  return (
    <div className={styles.tableScroll}>
      <div className={styles.tableHead}>
        <span className={styles.colStat}>{t("table.rank")}</span>
        <span />
        <span className={styles.colTeam}>{t("table.team")}</span>
        <span className={styles.colStat}>{t("table.played")}</span>
        <span className={styles.colStat}>{t("table.wins")}</span>
        <span className={styles.colStat}>{t("table.draws")}</span>
        <span className={styles.colStat}>{t("table.losses")}</span>
        <span className={styles.colStat}>{t("table.goalsFor")}</span>
        <span className={styles.colStat}>{t("table.goalsAgainst")}</span>
        <span className={styles.colStat}>{t("league.goalDiffShort")}</span>
        <span className={styles.colStat}>{t("table.points")}</span>
        <span className={styles.colStat}>{t("league.form")}</span>
        {/* <span className={styles.colStat}>{t("league.nextOpponent")}</span> */}
      </div>

      <ul className={styles.tableList}>
        {filtered.map((row) => {
          const bar = getQualificationBar(row.position, filtered.length);
          const goalDiff = row.scoresFor - row.scoresAgainst;
          const diffLabel = goalDiff > 0 ? `+${goalDiff}` : String(goalDiff);
          const barClass =
            bar === "ucl"
              ? styles.qualBarUcl
              : bar === "uel"
              ? styles.qualBarUel
              : bar === "rel"
              ? styles.qualBarRel
              : null;
          // const nextTeam = nextOpponents[row.team?.id];

          return (
            <li key={row.team?.id ?? row.position} className={styles.tableRow}>
              {barClass ? (
                <span className={`${styles.qualBar} ${barClass}`} />
              ) : (
                <span className={styles.qualBarPlaceholder} />
              )}
              <span className={styles.rank}>{row.position}</span>
              <img
                src={row.team?.logo}
                alt=""
                className={styles.teamLogo}
                loading="lazy"
              />
              <span className={styles.teamName} title={row.team?.name}>
                {row.team?.name}
              </span>
              <span className={styles.stat}>{row.matches}</span>
              <span className={styles.stat}>{row.wins}</span>
              <span className={styles.stat}>{row.draws}</span>
              <span className={styles.stat}>{row.losses}</span>
              <span className={styles.stat}>{row.scoresFor}</span>
              <span className={styles.stat}>{row.scoresAgainst}</span>
              <span className={styles.stat}>{diffLabel}</span>
              <span className={styles.stat}>{row.points}</span>
              <FormDots form={row.form} />
              {/* <span className={styles.nextOpponent}>
                {nextTeam?.logo ? (
                  <img
                    src={nextTeam.logo}
                    alt=""
                    title={nextTeam.name}
                    loading="lazy"
                  />
                ) : (
                  t("common.dash")
                )}
              </span> */}
            </li>
          );
        })}
      </ul>

      {showLegend ? (
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "#ffc107" }}
            />
            {t("league.legendCafCl")}
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "#1e88e5" }}
            />
            {t("league.legendCafCc")}
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "#e53935" }}
            />
            {t("league.legendRelegation")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function MatchRowLink({ game, showBadge = false }) {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language);
  const badge =
    game?.status?.type === "inprogress"
      ? "•"
      : game?.status?.type === "finished"
      ? t("league.matchFt")
      : null;
  const isTime = game?.status?.type === "notstarted";

  return (
    <Link
      to={`/game/${game.id}`}
      className={`${styles.matchRow} ${
        showBadge ? styles.matchRowWithBadge : ""
      }`}
    >
      {showBadge ? (
        <span className={styles.matchBadge}>{badge ?? ""}</span>
      ) : null}
      <div className={styles.matchTeams}>
        <span className={styles.matchTeamName}>{game.homeTeam.name}</span>
        <img
          src={game.homeTeam.logo}
          alt=""
          className={styles.matchTeamLogo}
          loading="lazy"
        />
        <span
          className={`${styles.matchCenter} ${isTime ? styles.matchTime : ""}`}
        >
          {getScoreOrTime(game, locale)}
        </span>
        <img
          src={game.awayTeam.logo}
          alt=""
          className={styles.matchTeamLogo}
          loading="lazy"
        />
        <span className={styles.matchTeamName}>{game.awayTeam.name}</span>
      </div>
    </Link>
  );
}

function StatLeaderCard({
  title,
  items,
  valueKey,
  variant,
  formatValue,
  showFooter = false,
}) {
  const { t } = useTranslation();

  return (
    <div className={styles.statCard}>
      <div className={styles.statCardHead}>
        <h3 className={styles.statCardTitle}>{title}</h3>
        <i className={`fi fi-rr-angle-small-right ${styles.statCardChevron}`} />
      </div>
      <ul className={styles.statCardList}>
        {items.map((item, idx) => (
          <li key={item.id ?? idx} className={styles.statCardRow}>
            {item.player ? (
              <>
                <img
                  src={item.player.photo}
                  alt=""
                  className={styles.playerAvatar}
                  loading="lazy"
                />
                <div className={styles.playerMeta}>
                  <span className={styles.playerName}>{item.player.name}</span>
                  <span className={styles.playerTeam}>
                    {item.team?.logo ? (
                      <img src={item.team.logo} alt="" loading="lazy" />
                    ) : null}
                    {item.team?.name}
                  </span>
                </div>
              </>
            ) : (
              <>
                <img
                  src={item.team?.logo}
                  alt=""
                  className={styles.teamAvatar}
                  loading="lazy"
                />
                <div className={styles.playerMeta}>
                  <span className={styles.playerName}>{item.team?.name}</span>
                </div>
              </>
            )}
            <ValueBadge
              value={formatValue ? formatValue(item[valueKey]) : item[valueKey]}
              variant={idx === 0 ? variant : undefined}
            />
          </li>
        ))}
      </ul>
      {showFooter ? (
        <button type="button" className={styles.cardFooterBtn}>
          {t("league.viewAll")}
        </button>
      ) : null}
    </div>
  );
}

function topN(list, key, n = 3, desc = true) {
  return [...list]
    .sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]))
    .slice(0, n);
}

function useFixtureDateLabel() {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language);

  return (timestamp) => {
    const d = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (gamesFormatDate(d) === gamesFormatDate(today)) return t("league.today");
    if (gamesFormatDate(d) === gamesFormatDate(yesterday)) {
      return t("league.yesterday");
    }

    return d.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };
}

function OverviewTab({ rows, fixtures, players }) {
  const { t } = useTranslation();
  const formatFixtureDate = useFixtureDateLabel();
  const [roundIndex, setRoundIndex] = useState(-1);

  const rounds = useMemo(() => {
    const map = new Map();
    for (const game of fixtures) {
      const round =
        game.league?.round || game.roundInfo?.round || t("league.roundDefault");
      if (!map.has(round)) map.set(round, []);
      map.get(round).push(game);
    }
    return [...map.entries()];
  }, [fixtures, t]);

  const activeRoundIdx =
    roundIndex >= 0 ? roundIndex : Math.max(0, rounds.length - 1);
  const activeRound = rounds[activeRoundIdx];
  const roundGames = activeRound?.[1] ?? [];

  const groupedByDate = useMemo(() => {
    const map = new Map();
    for (const game of roundGames) {
      const key = gamesFormatDate(new Date(game.startTimestamp * 1000));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(game);
    }
    return [...map.entries()];
  }, [roundGames]);

  const topScorers = topN(players, "goals");
  const topAssists = topN(players, "assists");
  const nextOpponents = useMemo(
    () => buildNextOpponentMap(fixtures),
    [fixtures]
  );

  return (
    <>
      <div className={styles.overviewGrid}>
        <div className={styles.standingsPanel}>
          {rows.length ? (
            <div className={styles.standingsPanelScroll}>
              <StandingsTable
                rows={rows}
                nextOpponents={nextOpponents}
                showLegend={false}
              />
            </div>
          ) : (
            <p className={styles.emptyState}>
              {t("league.standingsUnavailable")}
            </p>
          )}
        </div>

        <div className={styles.fixturesPanel}>
          <div className={styles.roundNav}>
            <button
              type="button"
              className={styles.navBtn}
              aria-label={t("league.prevRound")}
              disabled={activeRoundIdx <= 0}
              onClick={() => setRoundIndex(Math.max(0, activeRoundIdx - 1))}
            >
              <i className="fi fi-rr-angle-small-left" />
            </button>
            <h2 className={styles.roundTitle}>
              {activeRound?.[0] ?? t("league.roundFallback")}
            </h2>
            <button
              type="button"
              className={styles.navBtn}
              aria-label={t("league.nextRound")}
              disabled={activeRoundIdx >= rounds.length - 1}
              onClick={() =>
                setRoundIndex(Math.min(rounds.length - 1, activeRoundIdx + 1))
              }
            >
              <i className="fi fi-rr-angle-small-right" />
            </button>
          </div>

          {groupedByDate.length ? (
            groupedByDate.map(([dateKey, games]) => (
              <div key={dateKey}>
                <p className={styles.dateGroupTitle}>
                  {formatFixtureDate(games[0].startTimestamp)}
                </p>
                {games.map((game) => (
                  <MatchRowLink key={game.id} game={game} />
                ))}
              </div>
            ))
          ) : (
            <p className={styles.emptyState}>{t("league.noMatches")}</p>
          )}
        </div>
      </div>

      {/* <div className={styles.bottomGrid}>
        <StatLeaderCard
          title={t("league.topScorers")}
          items={topScorers}
          valueKey="goals"
          showFooter
        />
        <StatLeaderCard
          title={t("league.topAssists")}
          items={topAssists}
          valueKey="assists"
          variant="green"
          showFooter
        />
      </div> */}
    </>
  );
}

function StandingsTab({ rows, fixtures }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("total");
  const nextOpponents = useMemo(
    () => buildNextOpponentMap(fixtures),
    [fixtures]
  );

  const filterLabels = {
    total: t("league.filterAll"),
    home: t("league.filterHome"),
    away: t("league.filterAway"),
  };

  const displayRows = useMemo(() => {
    const mapped = rows.map((row) => applyStandingsFilter(row, filter));
    return mapped
      .sort((a, b) => {
        if (filter === "total") return a.position - b.position;
        return b.points - a.points || b.scoresFor - a.scoresFor;
      })
      .map((row, idx) => ({ ...row, position: idx + 1 }));
  }, [rows, filter]);

  return (
    <div className={styles.contentCard}>
      <div className={styles.filterPills}>
        {STANDINGS_FILTER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`${styles.pill} ${
              filter === id ? styles.pillActive : ""
            }`}
            onClick={() => setFilter(id)}
          >
            {filterLabels[id]}
          </button>
        ))}
      </div>
      {displayRows.length ? (
        <StandingsTable rows={displayRows} nextOpponents={nextOpponents} />
      ) : (
        <p className={styles.emptyState}>{t("league.standingsUnavailable")}</p>
      )}
    </div>
  );
}

function MatchesTab({ fixtures }) {
  const { t } = useTranslation();
  const formatFixtureDate = useFixtureDateLabel();
  const [dateIndex, setDateIndex] = useState(-1);

  const dates = useMemo(() => {
    const map = new Map();
    for (const game of fixtures) {
      const key = gamesFormatDate(new Date(game.startTimestamp * 1000));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(game);
    }
    return [...map.entries()];
  }, [fixtures]);

  const todayKey = gamesFormatDate(new Date());
  const defaultIdx = dates.findIndex(([key]) => key === todayKey);
  const activeIdx =
    dateIndex >= 0 ? dateIndex : defaultIdx >= 0 ? defaultIdx : 0;
  const activeDate = dates[activeIdx];

  const dateLabel = activeDate
    ? formatFixtureDate(activeDate[1][0].startTimestamp)
    : t("common.dash");

  return (
    <div className={styles.contentCard}>
      <div className={styles.dateNav}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label={t("league.prevDate")}
          disabled={activeIdx <= 0}
          onClick={() => setDateIndex(Math.max(0, activeIdx - 1))}
        >
          <i className="fi fi-rr-angle-small-left" />
        </button>
        <span className={styles.dateNavLabel}>{dateLabel}</span>
        <button
          type="button"
          className={styles.navBtn}
          aria-label={t("league.nextDate")}
          disabled={activeIdx >= dates.length - 1}
          onClick={() =>
            setDateIndex(Math.min(dates.length - 1, activeIdx + 1))
          }
        >
          <i className="fi fi-rr-angle-small-right" />
        </button>
      </div>

      {activeDate ? (
        activeDate[1].map((game) => (
          <MatchRowLink key={game.id} game={game} showBadge />
        ))
      ) : (
        <p className={styles.emptyState}>{t("league.noMatchesLeague")}</p>
      )}
    </div>
  );
}

function PlayerStatsTab({ players }) {
  const { t } = useTranslation();

  if (!players.length) {
    return (
      <div className={styles.contentCard}>
        <p className={styles.emptyState}>
          {t("league.playerStatsUnavailable")}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.contentCard}>
      <div className={styles.statsPage}>
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>{t("league.topStats")}</h2>
          <div className={styles.statGrid3}>
            <StatLeaderCard
              title={t("league.scorers")}
              items={topN(players, "goals")}
              valueKey="goals"
            />
            <StatLeaderCard
              title={t("league.topAssists")}
              items={topN(players, "assists")}
              valueKey="assists"
              variant="green"
            />
            <StatLeaderCard
              title={t("league.goalsAndAssists")}
              items={topN(players, "goalContributions")}
              valueKey="goalContributions"
            />
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>{t("league.discipline")}</h2>
          <div className={styles.statGrid2}>
            <StatLeaderCard
              title={t("league.yellowCards")}
              items={topN(players, "yellowCards")}
              valueKey="yellowCards"
              variant="green"
            />
            <StatLeaderCard
              title={t("league.redCards")}
              items={topN(players, "redCards")}
              valueKey="redCards"
              variant="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamStatsTab({ rows, leagueId, season }) {
  const { t } = useTranslation();
  const teamIds = rows.map((r) => r.team?.id).filter(Boolean);

  const { data: teamStats = [], isLoading } = useQuery({
    queryKey: ["league-team-stats", leagueId, season, teamIds.join(",")],
    queryFn: () => getLeagueTeamStats(teamIds, leagueId, season),
    enabled: teamIds.length > 0 && Boolean(leagueId && season),
    staleTime: 10 * 60_000,
  });

  const fromStandings = useMemo(() => {
    return rows.map((row) => ({
      id: row.team?.id,
      team: row.team,
      goalsPerMatch: row.matches ? row.scoresFor / row.matches : 0,
      concededPerMatch: row.matches ? row.scoresAgainst / row.matches : 0,
      cleanSheets: null,
      yellowCards: 0,
      redCards: 0,
    }));
  }, [rows]);

  const stats = teamStats.length ? teamStats : fromStandings;

  if (isLoading && !stats.length) {
    return (
      <div className={styles.contentCard}>
        <div className={styles.loadingWrap}>
          <Loader />
        </div>
      </div>
    );
  }

  const fmt = (v) => (typeof v === "number" ? v.toFixed(1) : v);
  const cleanSheetLeaders = topN(
    stats.filter((s) => typeof s.cleanSheets === "number"),
    "cleanSheets"
  );

  return (
    <div className={styles.contentCard}>
      <div className={styles.statsPage}>
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>{t("league.topStats")}</h2>
          <div className={styles.statGrid3}>
            <StatLeaderCard
              title={t("league.goalsPerMatch")}
              items={topN(stats, "goalsPerMatch")}
              valueKey="goalsPerMatch"
              variant="green"
              formatValue={fmt}
            />
            <StatLeaderCard
              title={t("league.goalsConcededPerMatch")}
              items={topN(stats, "concededPerMatch", 3, false)}
              valueKey="concededPerMatch"
              formatValue={fmt}
            />
            {cleanSheetLeaders.length ? (
              <StatLeaderCard
                title={t("league.cleanSheets")}
                items={cleanSheetLeaders}
                valueKey="cleanSheets"
                variant="green"
              />
            ) : (
              <div className={styles.statCard}>
                <div className={styles.statCardHead}>
                  <h3 className={styles.statCardTitle}>
                    {t("league.cleanSheets")}
                  </h3>
                </div>
                <p className={styles.emptyState}>
                  {t("league.dataUnavailable")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>{t("league.discipline")}</h2>
          <div className={styles.statGrid2}>
            <StatLeaderCard
              title={t("league.yellowCards")}
              items={topN(stats, "yellowCards")}
              valueKey="yellowCards"
            />
            <StatLeaderCard
              title={t("league.redCards")}
              items={topN(stats, "redCards")}
              valueKey="redCards"
              variant="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const TAB_LABEL_KEYS = {
  overview: "league.tabOverview",
  standings: "league.tabStandings",
  matches: "league.tabMatches",
  players: "league.tabPlayers",
  teams: "league.tabTeams",
};

export default function League() {
  const { t } = useTranslation();
  const { leagueId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [season, setSeason] = useState(null);
  const activeTab = searchParams.get("tab") || "overview";

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const {
    data: league,
    isLoading: leagueLoading,
    isError: leagueError,
  } = useQuery({
    queryKey: ["league-context", leagueId],
    queryFn: () => resolveLeagueContext(leagueId),
    enabled: Boolean(leagueId),
    staleTime: 30 * 60_000,
  });

  const activeSeason = season ?? league?.season ?? null;
  const leagueNumericId = league?.id;

  const needsStandings =
    activeTab === "overview" ||
    activeTab === "standings" ||
    activeTab === "teams";
  const needsFixtures =
    activeTab === "overview" ||
    activeTab === "standings" ||
    activeTab === "matches";
  const needsPlayers = activeTab === "overview" || activeTab === "players";

  const { data: standingsData, isLoading: standingsLoading } = useQuery({
    queryKey: ["league-standings", leagueNumericId, activeSeason],
    queryFn: () => getLeagueStandings(leagueNumericId, activeSeason),
    enabled: Boolean(leagueNumericId && activeSeason && needsStandings),
    staleTime: 5 * 60_000,
  });

  const { data: fixtures = [], isLoading: fixturesLoading } = useQuery({
    queryKey: ["league-fixtures", leagueNumericId, activeSeason],
    queryFn: () => getLeagueFixtures(leagueNumericId, activeSeason),
    enabled: Boolean(leagueNumericId && activeSeason && needsFixtures),
    staleTime: 5 * 60_000,
  });

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ["league-players", leagueNumericId, activeSeason],
    queryFn: () => getLeaguePlayerStats(leagueNumericId, activeSeason),
    enabled: Boolean(leagueNumericId && activeSeason && needsPlayers),
    staleTime: 10 * 60_000,
  });

  useQuery({
    queryKey: ["league-rounds", leagueNumericId, activeSeason],
    queryFn: () => getLeagueRounds(leagueNumericId, activeSeason),
    enabled: Boolean(leagueNumericId && activeSeason && needsFixtures),
    staleTime: 10 * 60_000,
  });

  const rows = standingsData?.rows ?? [];
  const displayName = standingsData?.leagueName || league?.name;
  const displayCountry = standingsData?.country || league?.country;
  const displayLogo = league?.logo;

  if (leagueLoading) {
    return (
      <section className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.contentCard}>
            <div className={styles.loadingWrap}>
              <Loader />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (leagueError || !league) {
    return (
      <section className={styles.page}>
        <div className={`${styles.shell} ${styles.notFound}`}>
          <h1>{t("league.notFoundTitle")}</h1>
          <p>{t("league.notFoundMessage")}</p>
          <Link to="/" className={styles.backLink}>
            <i className="fi fi-rr-angle-small-left" />
            {t("league.backHome")}
          </Link>
        </div>
      </section>
    );
  }

  const isLoading =
    (needsStandings && standingsLoading) ||
    (needsFixtures && fixturesLoading) ||
    (needsPlayers && playersLoading);
  const isMatchesLoading = activeTab === "matches" && fixturesLoading;

  const handleSeasonChange = (e) => {
    setSeason(Number(e.target.value));
  };

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.backRow}>
          <Link to="/" className={styles.backLink}>
            <i className="fi fi-rr-angle-small-left" />
            {t("gameDetail.matches")}
          </Link>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div className={styles.heroIdentity}>
              <div className={styles.leagueLogo}>
                <img src={displayLogo} alt="" loading="lazy" />
              </div>
              <div className={styles.heroText}>
                <h1 className={styles.leagueName}>{displayName}</h1>
                <span className={styles.leagueCountry}>{displayCountry}</span>
              </div>
            </div>

            <div className={styles.heroActions}>
              <select
                className={styles.seasonSelect}
                value={activeSeason ?? ""}
                onChange={handleSeasonChange}
              >
                {(league.seasons ?? []).map((year) => (
                  <option key={year} value={year}>
                    {formatSeasonLabel(year)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav className={styles.tabBar} aria-label={t("league.tabsLabel")}>
            {TAB_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className={`${styles.tab} ${
                  activeTab === id ? styles.tabActive : ""
                }`}
                onClick={() => setTab(id)}
              >
                {t(TAB_LABEL_KEYS[id])}
              </button>
            ))}
          </nav>
        </div>

        {isLoading || isMatchesLoading ? (
          <div className={styles.contentCard}>
            <div className={styles.loadingWrap}>
              <Loader />
            </div>
          </div>
        ) : null}

        {!isLoading && activeTab === "overview" ? (
          <OverviewTab rows={rows} fixtures={fixtures} players={players} />
        ) : null}

        {!isLoading && activeTab === "standings" ? (
          <StandingsTab rows={rows} fixtures={fixtures} />
        ) : null}

        {!isMatchesLoading && activeTab === "matches" ? (
          <MatchesTab fixtures={fixtures} />
        ) : null}

        {activeTab === "players" && playersLoading ? (
          <div className={styles.contentCard}>
            <div className={styles.loadingWrap}>
              <Loader />
            </div>
          </div>
        ) : null}

        {/* {!playersLoading && activeTab === "players" ? (
          <PlayerStatsTab players={players} />
        ) : null}

        {activeTab === "teams" ? (
          <TeamStatsTab
            rows={rows}
            leagueId={leagueNumericId}
            season={activeSeason}
          />
        ) : null} */}
      </div>
    </section>
  );
}
