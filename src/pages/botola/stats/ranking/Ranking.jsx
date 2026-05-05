import { useMemo } from "react";
import TableView from "../../../../components/table/TableView";
import { botolaStandingsTables } from "../../../../data/static/botolaStandings";

export default function Ranking({ onTeamClick }) {
  const stats = botolaStandingsTables;

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

  return <TableView data={rows} options={options} onTeamClick={onTeamClick} />;
}
