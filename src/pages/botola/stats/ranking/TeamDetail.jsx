import styles from "./TeamDetail.module.scss";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeamDetail } from "../../../../api/football/services/teamsService";
import { teamLogo } from "../../../../helpers/media.helpers";

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: () => getTeamDetail(teamId),
    enabled: Boolean(teamId),
  });

  const team = data?.team;
  const pregameForm = data?.pregameForm || null;
  const performanceEvents = data?.performanceEvents || [];
  const uniqueTournaments = data?.uniqueTournaments || [];
  const overallStats = data?.overallStats || {};
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
          Chargement des données de l'équipe...
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
        <div className={styles.panelCard}>Impossible de charger l'équipe.</div>
      </div>
    );
  }

  const name = team.fullName || team.name;
  const leagueName = team.primaryUniqueTournament?.name;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={onBack}>
        <i className="fi fi-rr-arrow-small-left" style={{ fontSize: 24 }} />
      </button>

      <header className={styles.heroCard}>
        <div className={styles.heroMain}>
          <div className={styles.logoRing}>
            <img className={styles.logo} src={teamLogo(team)} alt="" />
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
            </div>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Forme actuelle</h2>
            <div className={styles.formBars} role="img" aria-label="Forme">
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
              Classement : #{pregameForm?.position} · {pregameForm?.value} pts
            </p>
          </section>

          {team.venue?.name && (
            <section className={styles.sideCard}>
              <h2 className={styles.sideTitle}>Stade</h2>
              <p className={styles.sideStrong}>{team.venue.name}</p>
              <p className={styles.sideMuted}>{team.venue.city?.name}</p>
              {team.venue.capacity && (
                <p className={styles.sideMuted}>
                  Capacité : {team.venue.capacity.toLocaleString("fr-FR")}{" "}
                  places
                </p>
              )}
            </section>
          )}
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
              </div>
            </div>
          )}

          {tab === "stats" && (
            <div className={styles.tabPanel}>
              <section className={styles.panelCard}>
                <h2 className={styles.panelTitle}>
                  Performance des derniers matchs
                </h2>
                {performanceEvents.length === 0 ? (
                  <p className={styles.panelMuted}>Aucun match récent.</p>
                ) : (
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
                        {performanceEvents.slice(0, 10).map((ev) => {
                          const dateLabel = ev.startTimestamp
                            ? new Date(
                                ev.startTimestamp * 1000
                              ).toLocaleDateString("fr-FR")
                            : "—";
                          const homeScore = ev.homeScore?.display;
                          const awayScore = ev.awayScore?.display;
                          const score =
                            homeScore != null && awayScore != null
                              ? `${homeScore} - ${awayScore}`
                              : "—";
                          return (
                            <tr key={ev.id}>
                              <td>{dateLabel}</td>
                              <td>{ev.league?.name ?? "—"}</td>
                              <td>
                                {ev.homeTeam?.shortName} vs{" "}
                                {ev.awayTeam?.shortName}
                              </td>
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
                <h2 className={styles.panelTitle}>Statistiques saison</h2>
                <div className={styles.summaryTopGrid}>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>Matchs</span>
                    <span className={styles.summaryTopValue}>
                      {formatNumber(overallStats.matches)}
                    </span>
                  </div>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>Buts marqués</span>
                    <span className={styles.summaryTopValue}>
                      {formatNumber(overallStats.goalsScored)}
                    </span>
                  </div>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>
                      Buts encaissés
                    </span>
                    <span className={styles.summaryTopValue}>
                      {formatNumber(overallStats.goalsConceded)}
                    </span>
                  </div>
                  <div className={styles.summaryTopItem}>
                    <span className={styles.summaryTopLabel}>Buts / match</span>
                    <span className={styles.summaryTopValue}>
                      {perMatch(overallStats.goalsScored, matchesCount, 1)}
                    </span>
                  </div>
                </div>
              </section>

              {uniqueTournaments.length > 0 && (
                <section className={styles.panelCard}>
                  <h2 className={styles.panelTitle}>Compétitions</h2>
                  <div className={styles.competitionsGrid}>
                    {uniqueTournaments.map((tournament) => (
                      <article
                        key={tournament.id}
                        className={styles.competitionCard}
                      >
                        <h3 className={styles.competitionTitle}>
                          {tournament.name}
                        </h3>
                        <p className={styles.competitionMeta}>
                          {tournament.category?.name}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
