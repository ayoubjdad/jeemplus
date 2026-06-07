import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { fetchBotolaStandingsTables } from "../../../../api/botolaStandings";
import { useQuery } from "@tanstack/react-query";
import TableView from "../../../../components/table/TableView";
import { logosLinks, withBotolaTeamLogo } from "../../../../constants/botolaTeamLogos";

export { logosLinks };

export default function Ranking({ onTeamClick }) {
  const { t } = useTranslation();
  const { data: stats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchBotolaStandingsTables,
  });

  const rows = useMemo(() => {
    return (stats[0]?.rows || []).map((row) => ({
      ...row,
      team: withBotolaTeamLogo(row.team),
    }));
  }, [stats]);

  const options = [
    { label: t("table.rank"), value: "#" },
    { label: t("table.team"), value: "team" },
    { label: t("table.played"), value: "matches" },
    { label: t("table.wins"), value: "wins" },
    { label: t("table.draws"), value: "draws" },
    { label: t("table.losses"), value: "losses" },
    { label: t("table.goalsFor"), value: "scoresFor" },
    { label: t("table.goalsAgainst"), value: "scoresAgainst" },
    { label: t("table.goalDiff"), value: "scoreDiffFormatted" },
    { label: t("table.points"), value: "points" },
  ];

  if (statsLoading) {
    return <div>{t("botola.loading")}</div>;
  }

  return <TableView data={rows} options={options} onTeamClick={onTeamClick} />;
}
