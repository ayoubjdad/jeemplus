import styles from "./CompareTeams.module.scss";
import { useMemo, useState } from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  Stack,
  Divider,
  Avatar,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  autocomplete: {
    minWidth: 220,
    "& .MuiOutlinedInput-root": {
      borderRadius: 60,
      backgroundColor: "#fff",
      "& fieldset": {
        border: "2px solid #ccc",
      },
      "&:hover fieldset": {
        borderColor: "#0161fe",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#0161fe",
      },
    },
    "& .MuiInputLabel-root": {
      color: "#555",
    },
    "& .MuiAutocomplete-option": {
      borderRadius: 8,
      padding: "8px 12px",
      "&:hover": {
        backgroundColor: "#f5f5f5",
      },
    },
    "& .MuiAutocomplete-paper": {
      borderRadius: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    },
    "& .MuiAutocomplete-listbox": {
      padding: 4,
    },
  },
}));

export default function CompareTeams({}) {
  const queryClient = useQueryClient();

  const data = queryClient.getQueryData(["stats"]);

  const rows = useMemo(() => data?.[0]?.rows || [], [data]);

  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);

  const options = rows.map((r) => ({
    id: r.team.id,
    label: r.team.fieldTranslations?.nameTranslation?.fr || r.team.name,
    row: r,
  }));

  const aRow = teamA ? rows.find((r) => r.team.id === teamA.id) : null;
  const bRow = teamB ? rows.find((r) => r.team.id === teamB.id) : null;

  const classes = useStyles();

  return (
    <div className={styles.tableView}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Autocomplete
          options={options}
          getOptionLabel={(opt) => opt.label}
          value={teamA}
          onChange={(e, v) => setTeamA(v)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Équipe A" />
          )}
          className={classes.autocomplete}
        />

        <Autocomplete
          options={options}
          getOptionLabel={(opt) => opt.label}
          value={teamB}
          onChange={(e, v) => setTeamB(v)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Équipe B" />
          )}
          className={classes.autocomplete}
        />

        <button
          className={styles.button}
          onClick={() => {
            setTeamA(null);
            setTeamB(null);
          }}
        >
          Réinitialiser
        </button>
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
      <div className={styles.card}>
        <h3>{label}</h3>
        <p>Aucune équipe sélectionnée</p>
      </div>
    );
  }

  const name = row.team.fieldTranslations?.nameTranslation?.fr || row.team.name;
  const gd = row.scoresFor - row.scoresAgainst;

  return (
    <div className={styles.card}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={`https://img.sofascore.com/api/v1/team/${row.team.id}/image`}
        />
        <p>{name}</p>
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
    </div>
  );
}
