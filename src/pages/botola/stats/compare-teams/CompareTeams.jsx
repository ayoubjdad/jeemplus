import styles from "./CompareTeams.module.scss";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography, Stack, Divider, Avatar } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchBotolaStandingsTables } from "../../../../api/botolaStandings";
import { getTeamForm } from "../../../../api/football/services/teamsService";
import { teamLogo } from "../../../../helpers/media.helpers";
import { withBotolaTeamLogo } from "../../../../constants/botolaTeamLogos";

export default function CompareTeams() {
  const { t } = useTranslation();
  const { data: stats = [] } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchBotolaStandingsTables,
  });
  const rows = useMemo(
    () => (stats[0]?.rows || []).map((row) => ({
      ...row,
      team: withBotolaTeamLogo(row.team),
    })),
    [stats],
  );

  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);

  const options = rows.map((r) => ({
    id: r.team.id,
    label: r.team.name,
    row: r,
    logo: r.team.logo,
  }));
  const teamAOptions = options.filter((option) => option.id !== teamB?.id);
  const teamBOptions = options.filter((option) => option.id !== teamA?.id);

  const aRow = teamA ? rows.find((r) => r.team.id === teamA.id) : null;
  const bRow = teamB ? rows.find((r) => r.team.id === teamB.id) : null;

  return (
    <div className={styles.tableView}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <div className={styles.logoPicker}>
          <p className={styles.logoPickerTitle}>{t("compare.teamA")}</p>
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
                <img src={teamLogo(option.row.team)} alt={option.label} />
              </button>
            ))}
          </div>
        </div>
        <div className={styles.logoPicker}>
          <p className={styles.logoPickerTitle}>{t("compare.teamB")}</p>
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
                <img src={teamLogo(option.row.team)} alt={option.label} />
              </button>
            ))}
          </div>
        </div>

        <button
          className={styles.button}
          type="button"
          onClick={() => {
            setTeamA(null);
            setTeamB(null);
          }}
        >
          {t("common.reset")}
        </button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {!aRow && !bRow && (
        <Typography>{t("compare.selectTwoTeams")}</Typography>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TeamCompareCard row={aRow} label={t("compare.teamA")} />
        <TeamCompareCard row={bRow} label={t("compare.teamB")} />
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

function CompareInsights({ teamAId, teamBId, teamALabel, teamBLabel }) {
  const { t } = useTranslation();
  const { data: trendA = {} } = useQuery({
    queryKey: ["compare-form", teamAId],
    queryFn: () => getTeamForm(teamAId),
    enabled: Boolean(teamAId),
  });

  const { data: trendB = {} } = useQuery({
    queryKey: ["compare-form", teamBId],
    queryFn: () => getTeamForm(teamBId),
    enabled: Boolean(teamBId),
  });

  return (
    <div className={styles.insightsWrap}>
      <section className={styles.insightCard}>
        <h3>{t("compare.trendsTitle")}</h3>
        <div className={styles.trendsGrid}>
          <div className={styles.trendCol}>
            <h4>{teamALabel}</h4>
            <p>{t("compare.unbeaten")}{trendA.unbeaten ?? "—"}</p>
            <p>{t("compare.over25")}{trendA.over25 ?? "—"}</p>
            <p>{t("compare.bothScore")}{trendA.btts ?? "—"}</p>
            <p>{t("compare.firstToConcede")}{trendA.firstConceded ?? "—"}</p>
          </div>
          <div className={styles.trendCol}>
            <h4>{teamBLabel}</h4>
            <p>{t("compare.unbeaten")}{trendB.unbeaten ?? "—"}</p>
            <p>{t("compare.over25")}{trendB.over25 ?? "—"}</p>
            <p>{t("compare.bothScore")}{trendB.btts ?? "—"}</p>
            <p>{t("compare.firstToConcede")}{trendB.firstConceded ?? "—"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamCompareCard({ row, label }) {
  const { t } = useTranslation();
  if (!row) {
    return (
      <div className={styles.card}>
        <h3>{label}</h3>
        <p>{t("compare.noTeamSelected")}</p>
      </div>
    );
  }

  const name = row.team.name;
  const gd = row.scoresFor - row.scoresAgainst;

  return (
    <div className={styles.card}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={teamLogo(row.team)} />
        <p>{name}</p>
      </Stack>
      <Divider sx={{ my: 1 }} />
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td>{t("compare.matches")}</td>
            <td style={{ textAlign: "right" }}>{row.matches}</td>
          </tr>
          <tr>
            <td>{t("compare.wins")}</td>
            <td style={{ textAlign: "right" }}>{row.wins}</td>
          </tr>
          <tr>
            <td>{t("compare.draws")}</td>
            <td style={{ textAlign: "right" }}>{row.draws}</td>
          </tr>
          <tr>
            <td>{t("compare.losses")}</td>
            <td style={{ textAlign: "right" }}>{row.losses}</td>
          </tr>
          <tr>
            <td>{t("compare.goalsFor")}</td>
            <td style={{ textAlign: "right" }}>{row.scoresFor}</td>
          </tr>
          <tr>
            <td>{t("compare.goalsAgainst")}</td>
            <td style={{ textAlign: "right" }}>{row.scoresAgainst}</td>
          </tr>
          <tr>
            <td>{t("compare.diff")}</td>
            <td style={{ textAlign: "right" }}>{gd}</td>
          </tr>
          <tr>
            <td>{t("compare.points")}</td>
            <td style={{ textAlign: "right" }}>
              <strong>{row.points}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
