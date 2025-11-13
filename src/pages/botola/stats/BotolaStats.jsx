import { botstats, playerStatsData } from "../botstats";
import styles from "./BotolaStats.module.scss";
import { useState, useMemo } from "react";
import {
  Tabs,
  Tab,
  Box,
  Avatar,
  Autocomplete,
  TextField,
  Card,
  Typography,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { standingsUrls } from "../../../api/data";
import axios from "axios";

const fetchStats = async ({ queryKey }) => {
  try {
    const response = await axios.get(standingsUrls[0]);
    return response?.data?.standings || [];
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    return [];
  }
};

export default function BotolaStats() {
  const [activeView, setActiveView] = useState("ranking");
  const [playerSortKey, setPlayerSortKey] = useState("goals");
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);

  const { data: stats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });

  const rows = useMemo(() => stats[0]?.rows || [], [stats]);
  const players = useMemo(() => playerStatsData.results || [], []);

  const topAttack = useMemo(
    () => [...rows].sort((a, b) => b.scoresFor - a.scoresFor),
    [rows]
  );

  const topDefense = useMemo(
    () => [...rows].sort((a, b) => a.scoresAgainst - b.scoresAgainst),
    [rows]
  );

  const topPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => (b[playerSortKey] ?? 0) - (a[playerSortKey] ?? 0))
      .slice(0, 20);
  }, [players, playerSortKey]);

  return (
    <section className={styles.main}>
      <header className={styles.header}>
        <h2>📊 Statistiques Botola Pro D1</h2>
        <nav className={styles.nav}>
          <button
            className={activeView === "ranking" ? styles.active : ""}
            onClick={() => setActiveView("ranking")}
          >
            Classement
          </button>
          <button
            className={activeView === "attack" ? styles.active : ""}
            onClick={() => setActiveView("attack")}
          >
            Meilleures attaques
          </button>
          <button
            className={activeView === "defense" ? styles.active : ""}
            onClick={() => setActiveView("defense")}
          >
            Meilleures défenses
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
        {activeView === "ranking" && (
          <TableView title="Classement Général" data={rows} />
        )}

        {activeView === "attack" && (
          <TableView
            title="Top 5 des attaques"
            data={topAttack}
            kpi="scoresFor"
          />
        )}

        {activeView === "defense" && (
          <TableView
            title="Top 5 des défenses"
            data={topDefense}
            kpi="scoresAgainst"
          />
        )}

        {activeView === "players" && (
          <PlayersTableView
            title="Top Joueurs"
            data={topPlayers}
            sortKey={playerSortKey}
            onSortChange={setPlayerSortKey}
          />
        )}

        {activeView === "compare" && (
          <CompareTeamsView
            rows={rows}
            teamA={teamA}
            teamB={teamB}
            setTeamA={setTeamA}
            setTeamB={setTeamB}
          />
        )}
      </div>
    </section>
  );
}

function TableView({ title, data, kpi }) {
  return (
    <div className={styles.tableView}>
      <h3>{title}</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: "left" }}>Équipe</th>
            <th>MJ</th>
            <th>G</th>
            <th>N</th>
            <th>P</th>
            <th>BP</th>
            <th>BC</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.position}</td>
              <td style={{ textAlign: "left" }}>
                <span className={styles.teamName}>
                  {row.team.fieldTranslations?.nameTranslation?.fr ||
                    row.team.name}
                </span>
              </td>
              <td>{row.matches}</td>
              <td>{row.wins}</td>
              <td>{row.draws}</td>
              <td>{row.losses}</td>
              <td>{row.scoresFor}</td>
              <td>{row.scoresAgainst}</td>
              <td>
                <strong>{row.points}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 🆕 Player Stats with Dynamic Filter
function PlayersTableView({ title, data, sortKey, onSortChange }) {
  const statOptions = [
    { value: "goals", label: "Buts" },
    { value: "totalShots", label: "Tirs" },
    { value: "successfulDribbles", label: "Dribbles réussis" },
    { value: "goalConversionPercentage", label: "Taux de conversion" },
    { value: "rating", label: "Note moyenne" },
  ];

  return (
    <div className={styles.tableView}>
      <div className={styles.tableHeader}>
        <h3>{title}</h3>
        <div className={styles.filter}>
          <label>Filtrer par :</label>
          <select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value)}
            className={styles.select}
          >
            {statOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: "left" }}>Joueur</th>
            <th style={{ textAlign: "left" }}>Équipe</th>
            <th>Buts</th>
            <th>Tirs</th>
            <th>Dribbles</th>
            <th>Conversion %</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {data.map((player, index) => (
            <tr
              key={player.player.id}
              className={index === 0 ? styles.topRow : ""}
            >
              <td>{index + 1}</td>
              <td style={{ textAlign: "left" }}>
                {
                  // player.player.fieldTranslations?.nameTranslation?.ar ||
                  player.player.name
                }
              </td>
              <td style={{ textAlign: "left" }}>
                {
                  // player.team.fieldTranslations?.shortNameTranslation?.ar ||
                  player.team.name
                }
              </td>
              <td>{player.goals}</td>
              <td>{player.totalShots}</td>
              <td>{player.successfulDribbles}</td>
              <td>{player.goalConversionPercentage}%</td>
              <td>
                <strong>{player.rating}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Compare Teams UI ---
function CompareTeamsView({ rows, teamA, teamB, setTeamA, setTeamB }) {
  const options = rows.map((r) => ({
    id: r.team.id,
    label: r.team.fieldTranslations?.nameTranslation?.fr || r.team.name,
    row: r,
  }));

  const aRow = teamA ? rows.find((r) => r.team.id === teamA.id) : null;
  const bRow = teamB ? rows.find((r) => r.team.id === teamB.id) : null;

  return (
    <div className={styles.tableView}>
      <h3>Comparer deux équipes</h3>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Autocomplete
          options={options}
          getOptionLabel={(opt) => opt.label}
          value={teamA}
          onChange={(e, v) => setTeamA(v)}
          renderInput={(params) => <TextField {...params} label="Équipe A" />}
          sx={{ minWidth: 220 }}
        />

        <Autocomplete
          options={options}
          getOptionLabel={(opt) => opt.label}
          value={teamB}
          onChange={(e, v) => setTeamB(v)}
          renderInput={(params) => <TextField {...params} label="Équipe B" />}
          sx={{ minWidth: 220 }}
        />

        <Button
          variant="outlined"
          onClick={() => {
            setTeamA(null);
            setTeamB(null);
          }}
        >
          Réinitialiser
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {!aRow && !bRow && (
        <Typography>Veuillez sélectionner deux équipes à comparer.</Typography>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TeamCompareCard row={aRow} label="Équipe A" />
        <TeamCompareCard row={bRow} label="Équipe B" />
      </Stack>
    </div>
  );
}

function TeamCompareCard({ row, label }) {
  if (!row) {
    return (
      <Card sx={{ p: 2, flex: 1 }}>
        <Typography variant="subtitle1">{label}</Typography>
        <Typography color="text.secondary">
          Aucune équipe sélectionnée
        </Typography>
      </Card>
    );
  }

  const name = row.team.fieldTranslations?.nameTranslation?.fr || row.team.name;
  const gd = row.scoresFor - row.scoresAgainst;

  return (
    <Card sx={{ p: 2, flex: 1 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={`https://img.sofascore.com/api/v1/team/${row.team.id}/image`}
        />
        <div>
          <Typography variant="subtitle1">{name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </div>
      </Stack>

      <Divider sx={{ my: 1 }} />

      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td>Matchs</td>
            <td style={{ textAlign: "right" }}>{row.matches}</td>
          </tr>
          <tr>
            <td>Victoires</td>
            <td style={{ textAlign: "right" }}>{row.wins}</td>
          </tr>
          <tr>
            <td>Nuls</td>
            <td style={{ textAlign: "right" }}>{row.draws}</td>
          </tr>
          <tr>
            <td>Défaites</td>
            <td style={{ textAlign: "right" }}>{row.losses}</td>
          </tr>
          <tr>
            <td>BP</td>
            <td style={{ textAlign: "right" }}>{row.scoresFor}</td>
          </tr>
          <tr>
            <td>BC</td>
            <td style={{ textAlign: "right" }}>{row.scoresAgainst}</td>
          </tr>
          <tr>
            <td>Diff</td>
            <td style={{ textAlign: "right" }}>{gd}</td>
          </tr>
          <tr>
            <td>Pts</td>
            <td style={{ textAlign: "right" }}>
              <strong>{row.points}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}
