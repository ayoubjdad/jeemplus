import axios from "axios";
import React, { useMemo } from "react";
import { standingsUrls } from "../../../../api/data";
import { useQuery } from "@tanstack/react-query";
import TableView from "../../../../components/table/TableView";

export default function Ranking() {
  const fetchStats = async () => {
    try {
      const response = await axios.get(standingsUrls[0]);
      return response?.data?.standings || [];
    } catch (error) {
      console.error("❌ Error fetching games:", error);
      return [];
    }
  };

  const { data: stats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  const rows = useMemo(() => stats[0]?.rows || [], [stats]);

  const options = [
    { label: "#", value: "#" },
    { label: "Équipe", value: "team" },
    { label: "MJ", value: "matches" },
    { label: "G", value: "wins" },
    { label: "N", value: "draws" },
    { label: "P", value: "losses" },
    { label: "BP", value: "scoresFor" },
    { label: "BC", value: "scoresAgainst" },
    { label: "+/-", value: "scoreDiffFormatted" },
    { label: "Pts", value: "points" },
  ];

  if (statsLoading) {
    return <div>Loading...</div>;
  }

  return <TableView data={rows} options={options} />;
}
