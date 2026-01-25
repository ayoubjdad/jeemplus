import styles from "./BotolaStats.module.scss";
import { useState } from "react";
import Ranking from "./ranking/Ranking";
import PlayersStats from "./players-stats/PlayersStats";
import CompareTeams from "./compare-teams/CompareTeams";

export default function BotolaStats() {
  const [activeView, setActiveView] = useState("ranking");

  return (
    <section className={styles.main}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <button
            className={activeView === "ranking" ? styles.active : ""}
            onClick={() => setActiveView("ranking")}
          >
            Classement
          </button>
          <button
            className={activeView === "players" ? styles.active : ""}
            onClick={() => setActiveView("players")}
          >
            Top Joueurs
          </button>
          <button
            className={activeView === "compare" ? styles.active : ""}
            onClick={() => setActiveView("compare")}
          >
            Comparaison
          </button>
        </nav>
      </header>

      <div className={styles.content}>
        {activeView === "ranking" && <Ranking />}
        {activeView === "players" && <PlayersStats />}
        {activeView === "compare" && <CompareTeams />}
      </div>
    </section>
  );
}
