import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TableView from "../../components/table/TableView";
import {
  fetchWorldCupCupTrees,
  fetchWorldCupStandings,
} from "../../api/worldCupStandings";
import WorldCupCupTree from "./WorldCupCupTree";
import InteractiveScreen from "../interactive-screen/InteractiveScreen";
import styles from "./WorldCupStandings.module.scss";

const TABLE_OPTIONS = [
  { label: "#", value: "#" },
  { label: "Équipe", value: "team" },
  { label: "Statut", value: "qualification" },
  { label: "MJ", value: "matches" },
  { label: "G", value: "wins" },
  { label: "N", value: "draws" },
  { label: "P", value: "losses" },
  { label: "BP", value: "scoresFor" },
  { label: "BC", value: "scoresAgainst" },
  { label: "+/-", value: "scoreDiffFormatted" },
  { label: "Pts", value: "points" },
];

function mapRows(rows) {
  return (rows || []).map((r) => ({
    ...r,
    qualification: r.promotion?.text ?? "—",
  }));
}

function groupTitle(standing) {
  const fr =
    standing?.tournament?.fieldTranslations?.nameTranslation?.fr;
  return fr || standing?.name || standing?.tournament?.groupName || "Groupe";
}

export default function WorldCupStandings() {
  const [subTab, setSubTab] = useState("standings");

  const {
    data: standings = [],
    isLoading: standingsLoading,
    isError: standingsError,
  } = useQuery({
    queryKey: ["worldCupStandings", "unique-tournament-16-season-58210"],
    queryFn: fetchWorldCupStandings,
  });

  const {
    data: cupTrees = [],
    isLoading: treesLoading,
    isError: treesError,
  } = useQuery({
    queryKey: ["worldCupCupTrees", "unique-tournament-16-season-58210"],
    queryFn: fetchWorldCupCupTrees,
  });

  const groups = useMemo(
    () =>
      standings
        .filter((s) => s?.type === "total" && Array.isArray(s.rows))
        .map((s) => ({
          key: String(s.id ?? s.name ?? groupTitle(s)),
          title: groupTitle(s),
          rows: mapRows(s.rows),
        })),
    [standings],
  );

  const worldCupInteractivePicker = useMemo(
    () => ({
      rows: groups.flatMap((g) => g.rows),
      isLoading: standingsLoading,
      isError: standingsError,
    }),
    [groups, standingsLoading, standingsError],
  );

  const standingsBody = () => {
    if (standingsLoading) {
      return <div className={styles.state}>Chargement…</div>;
    }

    if (standingsError) {
      return (
        <div className={styles.state}>
          Impossible de charger le classement. Réessayez plus tard.
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className={styles.state}>
          Aucune donnée de classement pour le moment.
        </div>
      );
    }

    return (
      <div className={styles.groups}>
        {groups.map((g) => (
          <section key={g.key} className={styles.group}>
            <h3 className={styles.groupTitle}>{g.title}</h3>
            <TableView data={g.rows} options={TABLE_OPTIONS} />
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <h2 className={styles.pageTitle}>Coupe du monde</h2>
      <div className={styles.subNav}>
        <button
          type="button"
          className={
            subTab === "standings" ? styles.subNavBtnActive : styles.subNavBtn
          }
          onClick={() => setSubTab("standings")}
        >
          Classement
        </button>
        <button
          type="button"
          className={
            subTab === "bracket" ? styles.subNavBtnActive : styles.subNavBtn
          }
          onClick={() => setSubTab("bracket")}
        >
          Tableau coupe
        </button>
        <button
          type="button"
          className={
            subTab === "interactive" ? styles.subNavBtnActive : styles.subNavBtn
          }
          onClick={() => setSubTab("interactive")}
        >
          Écran interactif
        </button>
      </div>
      {subTab === "standings" && standingsBody()}
      {subTab === "bracket" && (
        <WorldCupCupTree trees={cupTrees} loading={treesLoading} error={treesError} />
      )}
      {subTab === "interactive" && (
        <div className={styles.interactiveWrap}>
          <InteractiveScreen
            embedded
            standingsPicker={worldCupInteractivePicker}
            teamPickerLabel="Équipe (Coupe du monde)"
            selectId="wc-interactive-national-team"
          />
        </div>
      )}
    </div>
  );
}
