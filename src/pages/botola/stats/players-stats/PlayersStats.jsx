import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import TableView from "../../../../components/table/TableView";
import { getBotolaTopPlayers } from "../../../../api/football/services/playersService";

export default function PlayersStats() {
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
    { value: "#", label: "#" },
    { value: "player", label: "Joueur" },
    { value: "team", label: "Équipe" },
    {
      value: "accuratePassesPercentage",
      label: "Pourcentage de passes réussite précis %",
    },
    { value: "assists", label: "Assists" },
    { value: "goals", label: "Buts" },
    { value: "successfulDribbles", label: "Dribbles réussis" },
    { value: "tackles", label: "Tacles" },
    { value: "rating", label: "Note moyenne" },
  ];

  return <TableView data={topPlayers} options={statOptions} />;
}
