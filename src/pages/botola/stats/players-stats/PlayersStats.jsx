import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useMemo, useState } from "react";
import TableView from "../../../../components/table/TableView";
import { getSofascoreApiV1Base } from "../../../../api/sofascoreBase";

export default function PlayersStats() {
  const [playerSortKey] = useState("rating");

  const fetchPlayersStats = async ({ queryKey }) => {
    try {
      const response = await axios.get(
        `${getSofascoreApiV1Base()}/unique-tournament/937/season/78750/statistics?limit=20&order=-rating&accumulation=total&group=summary`
      );
      return response?.data?.results || [];
    } catch (error) {
      console.error("❌ Error fetching games:", error);
      return [];
    }
  };
  const { data: playerStats = [] } = useQuery({
    queryKey: ["playerStats"],
    queryFn: fetchPlayersStats,
  });

  const topPlayers = useMemo(() => {
    return [...(playerStats || [])].sort(
      (a, b) => (b[playerSortKey] ?? 0) - (a[playerSortKey] ?? 0)
    );
    // .slice(0, 10);
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
