import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TableView from "../../../../components/table/TableView";
import { getBotolaTopPlayers } from "../../../../api/football/services/playersService";

export default function PlayersStats() {
  const { t } = useTranslation();
  const [playerSortKey] = useState("rating");

  const fetchPlayersStats = async () => {
    try {
      return await getBotolaTopPlayers();
    } catch (error) {
      console.error("Error fetching player stats:", error);
      return [];
    }
  };

  const { data: playerStats = [] } = useQuery({
    queryKey: ["playerStats"],
    queryFn: fetchPlayersStats,
  });

  const topPlayers = useMemo(() => {
    return [...(playerStats || [])].sort(
      (a, b) => (b[playerSortKey] ?? 0) - (a[playerSortKey] ?? 0),
    );
  }, [playerStats, playerSortKey]);

  const statOptions = [
    { value: "#", label: t("players.rank") },
    { value: "player", label: t("players.player") },
    { value: "team", label: t("players.team") },
    {
      value: "accuratePassesPercentage",
      label: t("players.passAccuracy"),
    },
    { value: "assists", label: t("players.assists") },
    { value: "goals", label: t("players.goals") },
    { value: "successfulDribbles", label: t("players.successfulDribbles") },
    { value: "tackles", label: t("players.tackles") },
    { value: "rating", label: t("players.averageRating") },
  ];

  return <TableView data={topPlayers} options={statOptions} />;
}
