import styles from "./CompareTeams.module.scss";
import { useMemo, useState } from "react";
import { Typography, Stack, Divider, Avatar } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export default function CompareTeams() {
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
  const teamAOptions = options.filter((option) => option.id !== teamB?.id);
  const teamBOptions = options.filter((option) => option.id !== teamA?.id);

  const aRow = teamA ? rows.find((r) => r.team.id === teamA.id) : null;
  const bRow = teamB ? rows.find((r) => r.team.id === teamB.id) : null;

  return (
    <div className={styles.tableView}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <div className={styles.logoPicker}>
          <p className={styles.logoPickerTitle}>Equipe A</p>
          <div className={styles.logoList}>
            {teamAOptions.map((option) => (
              <button
                key={`a-${option.id}`}
                type="button"
                className={`${styles.logoItem} ${
                  teamA?.id === option.id ? styles.logoItemActive : ""
                }`}
                onClick={() => setTeamA(option)}
              >
                <img
                  src={`https://img.sofascore.com/api/v1/team/${option.id}/image`}
                  alt={option.label}
                />
              </button>
            ))}
          </div>
        </div>
        <div className={styles.logoPicker}>
          <p className={styles.logoPickerTitle}>Equipe B</p>
          <div className={styles.logoList}>
            {teamBOptions.map((option) => (
              <button
                key={`b-${option.id}`}
                type="button"
                className={`${styles.logoItem} ${
                  teamB?.id === option.id ? styles.logoItemActive : ""
                }`}
                onClick={() => setTeamB(option)}
              >
                <img
                  src={`https://img.sofascore.com/api/v1/team/${option.id}/image`}
                  alt={option.label}
                />
              </button>
            ))}
          </div>
        </div>

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

      {teamA?.id && teamB?.id && (
        <CompareInsights
          teamAId={teamA.id}
          teamBId={teamB.id}
          teamALabel={teamA.label}
          teamBLabel={teamB.label}
        />
      )}
    </div>
  );
}

function normalizeResult(event, teamId) {
  const isHome = event?.homeTeam?.id === teamId;
  const isAway = event?.awayTeam?.id === teamId;
  if (!isHome && !isAway) return null;
  const homeScore = event?.homeScore?.current ?? event?.homeScore?.display;
  const awayScore = event?.awayScore?.current ?? event?.awayScore?.display;
  if (typeof homeScore !== "number" || typeof awayScore !== "number")
    return null;
  if (homeScore === awayScore) return "D";
  if ((isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)) {
    return "W";
  }
  return "L";
}

function buildTrend(events, teamId) {
  const recent = events.slice(0, 10);
  const finished = recent.filter((event) => event?.status?.type === "finished");
  if (!finished.length) {
    return { unbeaten: "—", over25: "—", btts: "—", firstConceded: "—" };
  }

  const unbeaten = finished.filter(
    (event) => normalizeResult(event, teamId) !== "L"
  ).length;
  const over25 = finished.filter((event) => {
    const h = event?.homeScore?.current ?? event?.homeScore?.display ?? 0;
    const a = event?.awayScore?.current ?? event?.awayScore?.display ?? 0;
    return h + a > 2.5;
  }).length;
  const btts = finished.filter((event) => {
    const h = event?.homeScore?.current ?? event?.homeScore?.display ?? 0;
    const a = event?.awayScore?.current ?? event?.awayScore?.display ?? 0;
    return h > 0 && a > 0;
  }).length;
  const firstConceded = finished.filter((event) => {
    const isHome = event?.homeTeam?.id === teamId;
    const h1 = event?.homeScore?.period1 ?? 0;
    const a1 = event?.awayScore?.period1 ?? 0;
    return isHome ? a1 > h1 : h1 > a1;
  }).length;

  return {
    unbeaten: `${unbeaten}/${finished.length}`,
    over25: `${over25}/${finished.length}`,
    btts: `${btts}/${finished.length}`,
    firstConceded: `${firstConceded}/${finished.length}`,
  };
}

function CompareInsights({ teamAId, teamBId, teamALabel, teamBLabel }) {
  const fetchPerformance = async (id) => {
    const response = await axios.get(
      `https://www.sofascore.com/api/v1/team/${id}/performance`
    );
    return response?.data || {};
  };

  const {
    data: perfA,
    // isLoading: loadingA
  } = useQuery({
    queryKey: ["compare-performance", teamAId],
    queryFn: () => fetchPerformance(teamAId),
    enabled: Boolean(teamAId),
  });

  const {
    data: perfB,
    // isLoading: loadingB
  } = useQuery({
    queryKey: ["compare-performance", teamBId],
    queryFn: () => fetchPerformance(teamBId),
    enabled: Boolean(teamBId),
  });

  const eventsA = perfA?.events || [];
  const eventsB = perfB?.events || [];

  const trendA = buildTrend(eventsA, teamAId);
  const trendB = buildTrend(eventsB, teamBId);

  return (
    <div className={styles.insightsWrap}>
      <section className={styles.insightCard}>
        <h3>Séries et tendances</h3>
        <div className={styles.trendsGrid}>
          <div className={styles.trendCol}>
            <h4>{teamALabel}</h4>
            <p>Sans défaite: {trendA.unbeaten}</p>
            <p>Plus de 2.5 buts: {trendA.over25}</p>
            <p>Les deux marquent: {trendA.btts}</p>
            <p>Premier à encaisser: {trendA.firstConceded}</p>
          </div>
          <div className={styles.trendCol}>
            <h4>{teamBLabel}</h4>
            <p>Sans défaite: {trendB.unbeaten}</p>
            <p>Plus de 2.5 buts: {trendB.over25}</p>
            <p>Les deux marquent: {trendB.btts}</p>
            <p>Premier à encaisser: {trendB.firstConceded}</p>
          </div>
        </div>
      </section>
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
