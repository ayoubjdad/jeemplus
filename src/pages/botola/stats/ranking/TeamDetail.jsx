import styles from "./TeamDetail.module.scss";
import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getSofascoreApiV1Base } from "../../../../api/sofascoreBase";

const TABS = [
  { id: "stats", label: "Statistiques" },
  { id: "resume", label: "Résumé" },
];

function flagEmoji(alpha2) {
  if (!alpha2 || alpha2.length !== 2) return "";
  const A = 0x1f1e6;
  const up = alpha2.toUpperCase();
  return String.fromCodePoint(
    A + up.charCodeAt(0) - "A".charCodeAt(0),
    A + up.charCodeAt(1) - "A".charCodeAt(0)
  );
}

function formBarHeight(letter) {
  if (letter === "W") return 92;
  if (letter === "D") return 52;
  if (letter === "L") return 78;
  return 40;
}

function formClass(letter) {
  if (letter === "W") return styles.formBarWin;
  if (letter === "D") return styles.formBarDraw;
  if (letter === "L") return styles.formBarLoss;
  return styles.formBarNeutral;
}

function formatNumber(value, digits = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function perMatch(value, matches, digits = 1) {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    typeof matches !== "number" ||
    !matches
  ) {
    return "—";
  }
  return formatNumber(value / matches, digits);
}

export default function TeamDetail({ teamId, onBack }) {
  const [tab, setTab] = useState("stats");

  const fetchTeamData = async () => {
    const base = getSofascoreApiV1Base();
    const response = await axios.get(`${base}/team/${teamId}`);
    return response?.data || {};
  };
  const fetchPerformanceData = async () => {
    const base = getSofascoreApiV1Base();
    const response = await axios.get(`${base}/team/${teamId}/performance`);
    return response?.data || {};
  };
  const fetchUniqueTournamentsData = async () => {
    const base = getSofascoreApiV1Base();
    const response = await axios.get(
      `${base}/team/${teamId}/unique-tournaments/all`
    );
    return response?.data || {};
  };
  const fetchOverallStatisticsData = async () => {
    const base = getSofascoreApiV1Base();
    const response = await axios.get(
      `${base}/team/${teamId}/unique-tournament/937/season/78750/statistics/overall`
    );
    return response?.data || {};
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: fetchTeamData,
    enabled: Boolean(teamId),
  });
  const {
    data: performanceData,
    isLoading: performanceLoading,
    isError: performanceError,
  } = useQuery({
    queryKey: ["team-performance", teamId],
    queryFn: fetchPerformanceData,
    enabled: Boolean(teamId),
  });
  const {
    data: uniqueTournamentsData,
    isLoading: uniqueTournamentsLoading,
    isError: uniqueTournamentsError,
  } = useQuery({
    queryKey: ["team-unique-tournaments", teamId],
    queryFn: fetchUniqueTournamentsData,
    enabled: Boolean(teamId),
  });
  const {
    data: overallStatsData,
  } = useQuery({
    queryKey: ["team-overall-statistics", teamId],
    queryFn: fetchOverallStatisticsData,
    enabled: Boolean(teamId),
  });

  const team = data?.team;
  const pregameForm = data?.pregameForm || null;
  const performanceEvents = performanceData?.events || [];
  const uniqueTournaments = uniqueTournamentsData?.uniqueTournaments || [];
  const overallStats = overallStatsData?.statistics || overallStatsData || {};
  const matchesCount =
    typeof overallStats?.matches === "number" ? overallStats.matches : 0;

  if (!teamId) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={onBack}>
          Retour au classement
        </button>
        <div className={styles.panelCard}>Aucune équipe sélectionnée.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={onBack}>
          Retour au classement
        </button>
        <div className={styles.panelCard}>
          Chargement des données de l’équipe...
        </div>
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={onBack}>
          Retour au classement
        </button>
        <div className={styles.panelCard}>
          Impossible de charger l’équipe depuis SofaScore.
        </div>
      </div>
    );
  }

  const name =
    team.fieldTranslations?.nameTranslation?.fr || team.fullName || team.name;

  const leagueName =
    team.primaryUniqueTournament?.fieldTranslations?.nameTranslation?.fr ||
    team.primaryUniqueTournament?.name;

  const managerImg = `https://img.sofascore.com/api/v1/manager/${team.manager?.id}/image`;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={onBack}>
        <i class="fi fi-rr-arrow-small-left" style={{ fontSize: 24 }} />
      </button>

      <header className={styles.heroCard}>
        <div className={styles.heroMain}>
          <div className={styles.logoRing}>
            <img
              className={styles.logo}
              src={`https://img.sofascore.com/api/v1/team/${team.id}/image`}
              alt=""
            />
          </div>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>{name}</h1>
            <div className={styles.metaRow}>
              <span className={styles.metaPill}>
                <span className={styles.metaFlag} aria-hidden>
                  {flagEmoji(team.country?.alpha2)}
                </span>
                {team.country?.name}
              </span>
              {leagueName && (
                <span className={styles.metaPill}>{leagueName}</span>
              )}
              {team.manager && (
                <span className={styles.metaPill}>
                  <img
                    className={styles.managerThumb}
                    src={managerImg}
                    alt=""
                    width={22}
                    height={22}
                  />
                  {team.manager.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* <div className={styles.heroAside}>
          <div className={styles.heroMini}>
            <span className={styles.heroMiniLabel}>Note moyenne</span>
            <span className={styles.heroMiniValue}>
              {pregameForm?.avgRating}
            </span>
          </div>
          <div className={styles.heroMini}>
            <span className={styles.heroMiniLabel}>5 derniers</span>
            <div className={styles.heroFormStrip}>
              {(pregameForm?.form || []).map((letter, i) => (
                <span
                  key={i}
                  className={`${styles.formChip} ${formClass(letter)}`}
                  title={
                    letter === "W"
                      ? "Victoire"
                      : letter === "D"
                      ? "Nul"
                      : "Défaite"
                  }
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div> */}
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Forme actuelle</h2>
            <div
              className={styles.formBars}
              role="img"
              aria-label="Forme sur cinq matchs"
            >
              {(pregameForm?.form || []).map((letter, i) => (
                <div key={i} className={styles.formBarWrap}>
                  <div
                    className={`${styles.formBar} ${formClass(letter)}`}
                    style={{ height: `${formBarHeight(letter)}%` }}
                  />
                  <span className={styles.formBarLabel}>{letter}</span>
                </div>
              ))}
            </div>
            <p className={styles.sideHint}>
              Classement indicatif : #{pregameForm?.position} · valeur{" "}
              {pregameForm?.value}
            </p>
          </section>

          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Stade</h2>
            <p className={styles.sideStrong}>{team.venue?.name}</p>
            <p className={styles.sideMuted}>
              {[team.venue?.city?.name, team.venue?.country?.name]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {typeof team.venue?.capacity === "number" && (
              <p className={styles.sideMuted}>
                Capacité : {team.venue.capacity.toLocaleString("fr-FR")} places
              </p>
            )}
          </section>

          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Couleurs</h2>
            <div className={styles.colorSwatches}>
              <span
                className={styles.swatch}
                style={{ background: team.teamColors?.primary }}
                title="Primaire"
              />
              <span
                className={styles.swatch}
                style={{ background: team.teamColors?.secondary }}
                title="Secondaire"
              />
              <span
                className={styles.swatch}
                style={{ background: team.teamColors?.text }}
                title="Texte"
              />
            </div>
          </section>
        </aside>

        <div className={styles.main}>
          <nav className={styles.tabs} aria-label="Sections équipe">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? styles.tabActive : styles.tab}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {tab === "resume" && (
            <div className={styles.tabPanel}>
              <div className={styles.statGrid}>
                {/* <div className={styles.statTile}>
                  <span className={styles.statLabel}>Note moyenne</span>
                  <span className={styles.statValue}>
                    {pregameForm?.avgRating}
                  </span>
                </div> */}
                <div className={styles.statTile}>
                  <span className={styles.statLabel}>Position Botola</span>
                  <span className={styles.statValue}>
                    {pregameForm?.position}
                  </span>
                </div>
                <div className={styles.statTile}>
                  <span className={styles.statLabel}>Points</span>
                  <span className={styles.statValue}>{pregameForm?.value}</span>
                </div>
                {/* <div className={styles.statTile}>
                  <span className={styles.statLabel}>Suiveurs (app)</span>
                  <span className={styles.statValue}>
                    {typeof team.userCount === "number"
                      ? team.userCount.toLocaleString("fr-FR")
                      : "—"}
                  </span>
                </div> */}
              </div>

              <section className={styles.panelCard}>
                <h2 className={styles.panelTitle}>Tendance de classement</h2>
                <p className={styles.panelMuted}>
                  Avec les données statiques actuelles, l’historique de position
                  par journée n’est pas fourni. Cette zone accueillera le
                  graphique lorsque la série temporelle sera disponible.
                </p>
                <div className={styles.chartPlaceholder} aria-hidden />
              </section>
            </div>
          )}

          {tab === "stats" && (
            <div className={styles.tabPanel}>
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Indicateur</th>
                      <th>Valeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* <tr>
                      <td>Note moyenne (5 derniers)</td>
                      <td>{pregameForm?.avgRating}</td>
                    </tr> */}
                    <tr>
                      <td>Position</td>
                      <td>{pregameForm?.position}</td>
                    </tr>
                    <tr>
                      <td>Points</td>
                      <td>{pregameForm?.value}</td>
                    </tr>
                    {/* <tr>
                      <td>Forme (séquence)</td>
                      <td>{(pregameForm?.form || []).join(" · ")}</td>
                    </tr> */}
                    {/* <tr>
                      <td>Abonnés (compteur)</td>
                      <td>
                        {typeof team.userCount === "number"
                          ? team.userCount.toLocaleString("fr-FR")
                          : "—"}
                      </td>
                    </tr> */}
                    {/* <tr>
                      <td>Compétition (tournoi)</td>
                      <td>{secondaryLeague}</td>
                    </tr> */}
                    <tr>
                      <td>Ligue principale</td>
                      <td>{leagueName}</td>
                    </tr>
                    <tr>
                      <td>Entraîneur</td>
                      <td>{team.manager?.name}</td>
                    </tr>
                    <tr>
                      <td>Stade</td>
                      <td>{team.venue?.name}</td>
                    </tr>
                    {/* <tr>
                      <td>Matchs performance</td>
                      <td>
                        {performanceLoading
                          ? "Chargement..."
                          : performanceEvents.length || "—"}
                      </td>
                    </tr> */}
                    {/* <tr>
                      <td>Compétitions jouées</td>
                      <td>
                        {uniqueTournamentsLoading
                          ? "Chargement..."
                          : uniqueTournaments.length || "—"}
                      </td>
                    </tr> */}
                    {/* <tr>
                      <td>Stats overall (937/78750)</td>
                      <td>
                        {overallStatsLoading
                          ? "Chargement..."
                          : overallStats?.id
                          ? "Disponible"
                          : "—"}
                      </td>
                    </tr> */}
                  </tbody>
                </table>
              </div>

              <section className={styles.panelCard}>
                <h2 className={styles.panelTitle}>
                  Performance des derniers matchs
                </h2>
                {performanceLoading && (
                  <p className={styles.panelMuted}>
                    Chargement des performances...
                  </p>
                )}
                {performanceError && (
                  <p className={styles.panelMuted}>
                    Impossible de charger les données de performance.
                  </p>
                )}
                {!performanceLoading &&
                  !performanceError &&
                  performanceEvents.length === 0 && (
                    <p className={styles.panelMuted}>
                      Aucun match de performance.
                    </p>
                  )}
                {!performanceLoading &&
                  !performanceError &&
                  performanceEvents.length > 0 && (
                    <div className={styles.tableWrap}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Compétition</th>
                            <th>Match</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performanceEvents.slice(0, 10).map((event) => {
                            const dateLabel = event.startTimestamp
                              ? new Date(
                                  event.startTimestamp * 1000
                                ).toLocaleDateString("fr-FR")
                              : "—";
                            const tournamentName =
                              event.tournament?.uniqueTournament?.name ||
                              event.tournament?.name ||
                              "—";
                            const homeName =
                              event.homeTeam?.shortName ||
                              event.homeTeam?.name ||
                              "Home";
                            const awayName =
                              event.awayTeam?.shortName ||
                              event.awayTeam?.name ||
                              "Away";
                            const homeScore = event.homeScore?.current;
                            const awayScore = event.awayScore?.current;
                            const score =
                              typeof homeScore === "number" &&
                              typeof awayScore === "number"
                                ? `${homeScore} - ${awayScore}`
                                : "—";

                            return (
                              <tr key={event.id}>
                                <td>{dateLabel}</td>
                                <td>{tournamentName}</td>
                                <td>{`${homeName} vs ${awayName}`}</td>
                                <td>{score}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
              </section>

              <section className={styles.panelCard}>
                <h2 className={styles.panelTitle}>
                  Résumé détaillé (style SofaScore)
                </h2>
                <div className={styles.summaryTopGrid}>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>Matchs</span>
                    <span className={styles.summaryTopValue}>
                      {formatNumber(overallStats?.matches)}
                    </span>
                  </div>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>Buts marqués</span>
                    <span className={styles.summaryTopValue}>
                      {formatNumber(overallStats?.goalsScored)}
                    </span>
                  </div>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>
                      Buts encaissés
                    </span>
                    <span className={styles.summaryTopValue}>
                      {formatNumber(overallStats?.goalsConceded)}
                    </span>
                  </div>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>
                      Passes décisives
                    </span>
                    <span className={styles.summaryTopValue}>
                      {formatNumber(overallStats?.assists)}
                    </span>
                  </div>
                </div>

                <div className={styles.statsColumns}>
                  <div className={styles.statsColumn}>
                    <h3 className={styles.statsColumnTitle}>Attaquer</h3>
                    <ul className={styles.statsList}>
                      <li>
                        <span>Buts par match</span>
                        <strong>
                          {perMatch(overallStats?.goalsScored, matchesCount, 1)}
                        </strong>
                      </li>
                      <li>
                        <span>Buts sur pénalty</span>
                        <strong>
                          {formatNumber(overallStats?.penaltyGoals)} /{" "}
                          {formatNumber(overallStats?.penaltiesTaken)}
                        </strong>
                      </li>
                      <li>
                        <span>Tirs par match</span>
                        <strong>
                          {perMatch(overallStats?.shots, matchesCount, 1)}
                        </strong>
                      </li>
                      <li>
                        <span>Tirs contre par match</span>
                        <strong>
                          {perMatch(
                            overallStats?.shotsAgainst,
                            matchesCount,
                            1
                          )}
                        </strong>
                      </li>
                      <li>
                        <span>Tirs cadrés (approx.)</span>
                        <strong>
                          {formatNumber(overallStats?.shots)}/
                          {formatNumber(overallStats?.shotsAgainst)}
                        </strong>
                      </li>
                      <li>
                        <span>Grosses occasions ratées</span>
                        <strong>
                          {formatNumber(overallStats?.errorsLeadingToShot)}
                        </strong>
                      </li>
                      <li>
                        <span>Dribbles réussis / tentés</span>
                        <strong>
                          {formatNumber(overallStats?.successfulDribbles)} /{" "}
                          {formatNumber(overallStats?.dribbleAttempts)}
                        </strong>
                      </li>
                      <li>
                        <span>Corners par match</span>
                        <strong>
                          {perMatch(overallStats?.corners, matchesCount, 1)}
                        </strong>
                      </li>
                      <li>
                        <span>Hors-jeu</span>
                        <strong>{formatNumber(overallStats?.offsides)}</strong>
                      </li>
                    </ul>
                  </div>

                  <div className={styles.statsColumn}>
                    <h3 className={styles.statsColumnTitle}>Passes</h3>
                    <ul className={styles.statsList}>
                      <li>
                        <span>Possession</span>
                        <strong>
                          {typeof overallStats?.averageBallPossession ===
                          "number"
                            ? `${overallStats.averageBallPossession}%`
                            : "—"}
                        </strong>
                      </li>
                      <li>
                        <span>Passes précises</span>
                        <strong>
                          {formatNumber(overallStats?.accuratePasses)} (
                          {typeof overallStats?.accuratePassesPercentage ===
                          "number"
                            ? `${overallStats.accuratePassesPercentage}%`
                            : "—"}
                          )
                        </strong>
                      </li>
                      <li>
                        <span>Longues passes précises</span>
                        <strong>
                          {formatNumber(overallStats?.accurateLongBalls)} (
                          {typeof overallStats?.accurateLongBallsPercentage ===
                          "number"
                            ? `${overallStats.accurateLongBallsPercentage}%`
                            : "—"}
                          )
                        </strong>
                      </li>
                      <li>
                        <span>Centres précis</span>
                        <strong>
                          {formatNumber(overallStats?.accurateCrosses)} (
                          {typeof overallStats?.accurateCrossesPercentage ===
                          "number"
                            ? `${overallStats.accurateCrossesPercentage}%`
                            : "—"}
                          )
                        </strong>
                      </li>
                      <li>
                        <span>Passes totales</span>
                        <strong>
                          {formatNumber(overallStats?.totalPasses)}
                        </strong>
                      </li>
                      <li>
                        <span>Long ball totaux</span>
                        <strong>
                          {formatNumber(overallStats?.totalLongBalls)}
                        </strong>
                      </li>
                      <li>
                        <span>Centres totaux</span>
                        <strong>
                          {formatNumber(overallStats?.totalCrosses)}
                        </strong>
                      </li>
                      <li>
                        <span>Coups francs</span>
                        <strong>{formatNumber(overallStats?.freeKicks)}</strong>
                      </li>
                    </ul>
                  </div>

                  <div className={styles.statsColumn}>
                    <h3 className={styles.statsColumnTitle}>Défense</h3>
                    <ul className={styles.statsList}>
                      <li>
                        <span>Cage inviolée</span>
                        <strong>
                          {formatNumber(overallStats?.cleanSheets)}
                        </strong>
                      </li>
                      <li>
                        <span>Buts encaissés par match</span>
                        <strong>
                          {perMatch(
                            overallStats?.goalsConceded,
                            matchesCount,
                            1
                          )}
                        </strong>
                      </li>
                      <li>
                        <span>Interceptions par match</span>
                        <strong>
                          {perMatch(
                            overallStats?.interceptions,
                            matchesCount,
                            1
                          )}
                        </strong>
                      </li>
                      <li>
                        <span>Arrêts par match</span>
                        <strong>
                          {perMatch(overallStats?.saves, matchesCount, 1)}
                        </strong>
                      </li>
                      <li>
                        <span>Dégagements (goal kicks)</span>
                        <strong>{formatNumber(overallStats?.goalKicks)}</strong>
                      </li>
                      <li>
                        <span>Ballons récupérés</span>
                        <strong>
                          {formatNumber(overallStats?.ballRecovery)}
                        </strong>
                      </li>
                      <li>
                        <span>Erreurs menant à un tir</span>
                        <strong>
                          {formatNumber(overallStats?.errorsLeadingToShot)}
                        </strong>
                      </li>
                    </ul>
                  </div>

                  <div className={styles.statsColumn}>
                    <h3 className={styles.statsColumnTitle}>Autre</h3>
                    <ul className={styles.statsList}>
                      <li>
                        <span>Duels remportés</span>
                        <strong>
                          {formatNumber(overallStats?.duelsWon)} (
                          {typeof overallStats?.duelsWonPercentage === "number"
                            ? `${overallStats.duelsWonPercentage}%`
                            : "—"}
                          )
                        </strong>
                      </li>
                      <li>
                        <span>Duels aériens remportés</span>
                        <strong>
                          {formatNumber(overallStats?.aerialDuelsWon)} (
                          {typeof overallStats?.aerialDuelsWonPercentage ===
                          "number"
                            ? `${overallStats.aerialDuelsWonPercentage}%`
                            : "—"}
                          )
                        </strong>
                      </li>
                      <li>
                        <span>Fautes</span>
                        <strong>{formatNumber(overallStats?.fouls)}</strong>
                      </li>
                      <li>
                        <span>Cartons jaunes</span>
                        <strong>
                          {formatNumber(overallStats?.yellowCards)}
                        </strong>
                      </li>
                      <li>
                        <span>Cartons rouges</span>
                        <strong>{formatNumber(overallStats?.redCards)}</strong>
                      </li>
                      <li>
                        <span>Jaune-Rouge</span>
                        <strong>
                          {formatNumber(overallStats?.yellowRedCards)}
                        </strong>
                      </li>
                      <li>
                        <span>Matchs attribués</span>
                        <strong>
                          {formatNumber(overallStats?.awardedMatches)}
                        </strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className={styles.panelCard}>
                <h2 className={styles.panelTitle}>Compétitions disputées</h2>
                {uniqueTournamentsLoading && (
                  <p className={styles.panelMuted}>
                    Chargement des compétitions...
                  </p>
                )}
                {uniqueTournamentsError && (
                  <p className={styles.panelMuted}>
                    Impossible de charger les compétitions de l’équipe.
                  </p>
                )}
                {!uniqueTournamentsLoading &&
                  !uniqueTournamentsError &&
                  uniqueTournaments.length === 0 && (
                    <p className={styles.panelMuted}>
                      Aucune compétition trouvée.
                    </p>
                  )}
                {!uniqueTournamentsLoading &&
                  !uniqueTournamentsError &&
                  uniqueTournaments.length > 0 && (
                    <div className={styles.competitionsGrid}>
                      {uniqueTournaments.map((tournament) => {
                        const tournamentName =
                          tournament?.fieldTranslations?.nameTranslation?.fr ||
                          tournament?.name ||
                          "Compétition";
                        const categoryName =
                          tournament?.category?.fieldTranslations
                            ?.nameTranslation?.fr ||
                          tournament?.category?.name ||
                          "";

                        return (
                          <article
                            key={
                              tournament.id || tournament.slug || tournamentName
                            }
                            className={styles.competitionCard}
                          >
                            <span
                              className={styles.competitionAccent}
                              style={{
                                background:
                                  tournament.primaryColorHex || "#00fe7a",
                              }}
                            />
                            <h3 className={styles.competitionTitle}>
                              {tournamentName}
                            </h3>
                            <p className={styles.competitionMeta}>
                              {categoryName}
                              {typeof tournament.userCount === "number"
                                ? ` · ${tournament.userCount.toLocaleString(
                                    "fr-FR"
                                  )} followers`
                                : ""}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
