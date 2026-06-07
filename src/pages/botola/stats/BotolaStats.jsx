import styles from "./BotolaStats.module.scss";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Ranking from "./ranking/Ranking";
import PlayersStats from "./players-stats/PlayersStats";
import CompareTeams from "./compare-teams/CompareTeams";
import TeamDetail from "./ranking/TeamDetail";

export default function BotolaStats() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState("ranking");
  const [rankingTeamDetailOpen, setRankingTeamDetailOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  return (
    <section className={styles.main}>
      <header className={styles.header}>
        <h1>{t("botola.title")}</h1>
        <nav className={styles.nav}>
          <button
            className={activeView === "ranking" ? styles.active : ""}
            onClick={() => {
              setActiveView("ranking");
              setRankingTeamDetailOpen(false);
              setSelectedTeamId(null);
            }}
          >
            {t("botola.ranking")}
          </button>
          {/* <button
            className={activeView === "players" ? styles.active : ""}
            onClick={() => {
              setActiveView("players");
              setRankingTeamDetailOpen(false);
              setSelectedTeamId(null);
            }}
          >
            Top Joueurs
          </button> */}
          <button
            className={activeView === "compare" ? styles.active : ""}
            onClick={() => {
              setActiveView("compare");
              setRankingTeamDetailOpen(false);
              setSelectedTeamId(null);
            }}
          >
            {t("botola.compare")}
          </button>
        </nav>
      </header>

      <div className={styles.content}>
        {activeView === "ranking" && !rankingTeamDetailOpen && (
          <Ranking
            onTeamClick={(row) => {
              setSelectedTeamId(row?.team?.id || null);
              setRankingTeamDetailOpen(true);
            }}
          />
        )}
        {activeView === "ranking" && rankingTeamDetailOpen && (
          <TeamDetail
            teamId={selectedTeamId}
            onBack={() => {
              setRankingTeamDetailOpen(false);
              setSelectedTeamId(null);
            }}
          />
        )}
        {activeView === "players" && <PlayersStats />}
        {activeView === "compare" && <CompareTeams />}
      </div>
    </section>
  );
}
