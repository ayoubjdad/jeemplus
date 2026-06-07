import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import TableView from "../../components/table/TableView";
import {
  fetchWorldCupCupTrees,
  fetchWorldCupStandings,
} from "../../api/worldCupStandings";
import WorldCupCupTree from "./WorldCupCupTree";
import InteractiveScreen from "../interactive-screen/InteractiveScreen";
import styles from "./WorldCupStandings.module.scss";

function mapRows(rows) {
  return (rows || []).map((r) => ({
    ...r,
    qualification: r.promotion?.text ?? "—",
  }));
}

function groupTitle(standing, fallback) {
  const fr =
    standing?.tournament?.fieldTranslations?.nameTranslation?.fr;
  return fr || standing?.name || standing?.tournament?.groupName || fallback;
}

export default function WorldCupStandings() {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState("standings");

  const TABLE_OPTIONS = [
    { label: t("table.rank"), value: "#" },
    { label: t("table.team"), value: "team" },
    { label: t("table.status"), value: "qualification" },
    { label: t("table.played"), value: "matches" },
    { label: t("table.wins"), value: "wins" },
    { label: t("table.draws"), value: "draws" },
    { label: t("table.losses"), value: "losses" },
    { label: t("table.goalsFor"), value: "scoresFor" },
    { label: t("table.goalsAgainst"), value: "scoresAgainst" },
    { label: t("table.goalDiff"), value: "scoreDiffFormatted" },
    { label: t("table.points"), value: "points" },
  ];

  const {
    data: standings = [],
    isLoading: standingsLoading,
    isError: standingsError,
  } = useQuery({
    queryKey: ["worldCupStandings"],
    queryFn: fetchWorldCupStandings,
  });

  const {
    data: cupTrees = [],
    isLoading: treesLoading,
    isError: treesError,
  } = useQuery({
    queryKey: ["worldCupCupTrees"],
    queryFn: fetchWorldCupCupTrees,
  });

  const groups = useMemo(
    () =>
      standings
        .filter((s) => s?.type === "total" && Array.isArray(s.rows))
        .map((s) => ({
          key: String(s.id ?? s.name ?? groupTitle(s, t("worldCup.group"))),
          title: groupTitle(s, t("worldCup.group")),
          rows: mapRows(s.rows),
        })),
    [standings, t],
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
      return <div className={styles.state}>{t("worldCup.loadingStandings")}</div>;
    }

    if (standingsError) {
      return (
        <div className={styles.state}>{t("worldCup.errorStandings")}</div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className={styles.state}>{t("worldCup.emptyStandings")}</div>
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
      <h2 className={styles.pageTitle}>{t("worldCup.title")}</h2>
      <div className={styles.subNav}>
        <button
          type="button"
          className={
            subTab === "standings" ? styles.subNavBtnActive : styles.subNavBtn
          }
          onClick={() => setSubTab("standings")}
        >
          {t("worldCup.ranking")}
        </button>
        <button
          type="button"
          className={
            subTab === "bracket" ? styles.subNavBtnActive : styles.subNavBtn
          }
          onClick={() => setSubTab("bracket")}
        >
          {t("worldCup.bracket")}
        </button>
        <button
          type="button"
          className={
            subTab === "interactive" ? styles.subNavBtnActive : styles.subNavBtn
          }
          onClick={() => setSubTab("interactive")}
        >
          {t("worldCup.interactiveScreen")}
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
            teamPickerLabel={t("worldCup.teamPickerLabel")}
            selectId="wc-interactive-national-team"
          />
        </div>
      )}
    </div>
  );
}
