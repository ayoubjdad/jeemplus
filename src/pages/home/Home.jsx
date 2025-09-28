import React, { useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { gamesUrl } from "../../api/data";
import { gamesFormatDate } from "../../helpers/global.helper";
import styles from "./Home.module.scss";
import { topTeams, tournamentsPriority } from "../../data/Tournaments";
import Loader from "../../layouts/loader/Loader";
import { Box } from "@mui/material";

const isToday = (date, timestamp) => {
  const startTime = new Date(timestamp * 1000);
  return startTime.toLocaleDateString() === date.toLocaleDateString();
};

const fetchGames = async ({ queryKey }) => {
  const [, date] = queryKey;
  try {
    const response = await axios.get(`${gamesUrl}${gamesFormatDate(date)}`);
    return response?.data?.events || [];
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    return [];
  }
};

const fetchTeamPlayers = async ({ queryKey }) => {
  const [, teamId] = queryKey;
  try {
    const response = await axios.get(
      `https://www.sofascore.com/api/v1/team/${teamId}/players`
    );
    return response?.data || {};
  } catch (err) {
    return {};
  }
};

const getMoroccanPlayers = (homePlayers, awayPlayers) => {
  const isMoroccan = (p) => p?.player?.country?.name === "Morocco";
  return [
    ...homePlayers?.filter(isMoroccan),
    ...awayPlayers?.filter(isMoroccan),
  ];
};

const renderPlayerCard = ({ player }) => (
  <div key={player.id} className={styles.playerCard}>
    {player.jerseyNumber && (
      <p className={styles.jerseyNumber}>{player.jerseyNumber}</p>
    )}
    <img
      src={`https://img.sofascore.com/api/v1/player/${player.id}/image`}
      alt={player.name}
      className={styles.playerImage}
    />
    <p className={styles.playerName}>{player.name}</p>
  </div>
);

const DatePicker = ({ date, setDate }) => {
  const dateString = gamesFormatDate(date).split("-");
  const month = dateString[1];
  const day = dateString[2];
  return (
    <div className={styles.datePicker}>
      <Box
        component="i"
        className={`fi fi-rr-angle-left ${styles.arrow}`}
        onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}
      />
      <Box component="i" className="fi fi-rr-calendar-day" />
      <p>
        {day}/{month}
      </p>
      <Box
        component="i"
        className={`fi fi-rr-angle-right ${styles.arrow}`}
        onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}
      />
    </div>
  );
};

const GameCard = ({ game }) => {
  const timeString = (timestamp) => {
    const startTime = new Date(timestamp * 1000);
    return startTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tournamentImage = `https://img.sofascore.com/api/v1/unique-tournament/${game?.tournament?.uniqueTournament?.id}/image`;
  const score =
    game.status.type === "finished"
      ? `${game.homeScore.display} - ${game.awayScore.display}`
      : timeString(game?.startTimestamp);

  return (
    <div className={styles.matchHeader}>
      <Team team={game.homeTeam} />
      <div className={styles.time}>
        <img
          src={tournamentImage}
          alt={game?.tournament?.uniqueTournament?.name}
        />
        <h5>{score}</h5>
      </div>
      <Team team={game.awayTeam} />
    </div>
  );
};

export default function Data() {
  const [date, setDate] = useState(new Date());

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games", date],
    queryFn: fetchGames,
    // ...options,
  });

  const highlightedGames = useMemo(() => {
    return games
      .filter((game) => {
        const isTopTeam = topTeams.some(
          (t) => t.id === game.homeTeam.id || t.id === game.awayTeam.id
        );
        const isFromBotola = game.tournament.uniqueTournament.id === 937;
        return (
          (isTopTeam || isFromBotola) && isToday(date, game?.startTimestamp)
        );
      })
      .sort(
        (a, b) =>
          a.tournament.uniqueTournament.id - b.tournament.uniqueTournament.id
      );
  }, [games, date]);

  const { data: enrichedGames = [], isLoading: playersLoading } = useQuery({
    queryKey: ["enrichedGames", games],
    queryFn: async () => {
      const prioritizedGames = [...games].filter(
        (g) =>
          tournamentsPriority.some(
            (t) => t.id === g.tournament.uniqueTournament.id
          ) &&
          isToday(date, g?.startTimestamp) &&
          g.awayTeam.country.name !== "Morocco" &&
          g.homeTeam.country.name !== "Morocco"
      );

      return Promise.all(
        prioritizedGames.map(async (game) => {
          const [home, away] = await Promise.all([
            fetchTeamPlayers({ queryKey: ["teamPlayers", game.homeTeam.id] }),
            fetchTeamPlayers({ queryKey: ["teamPlayers", game.awayTeam.id] }),
          ]);

          return {
            id: game.id,
            game,
            homeTeam: { team: game.homeTeam, ...home },
            awayTeam: { team: game.awayTeam, ...away },
          };
        })
      );
    },
    enabled: games.length > 0,
  });

  if (gamesLoading || playersLoading) return <Loader />;

  return (
    <section className={styles.main}>
      <DatePicker date={date} setDate={setDate} />
      <h4>أهم مباريات اليوم</h4>
      <div className={styles.container}>
        {highlightedGames.map((game) => (
          <div key={game.id} className={styles.card}>
            <GameCard key={game.id} game={game} />
          </div>
        ))}
      </div>
      <h4>اللاعبين الدوليين</h4>
      <div className={styles.container}>
        {enrichedGames.map((game) => {
          const moroccanPlayers = getMoroccanPlayers(
            game.homeTeam.players || [],
            game.awayTeam.players || []
          );
          if (moroccanPlayers.length === 0) return null;

          return (
            <div key={game.id} className={styles.playersBlock}>
              <GameCard game={game.game} />
              <div className={styles.playersList}>
                {moroccanPlayers.map((playerObj) =>
                  renderPlayerCard(playerObj)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Reuse existing components
const Team = ({ team, fromGame = false }) => (
  <div className={styles.team}>
    <img
      src={`https://img.sofascore.com/api/v1/team/${team?.id}/image`}
      alt={team?.name}
      className={styles.teamImage}
    />
    <p className={styles.teamName} style={{ height: fromGame && "auto" }}>
      {team?.name}
    </p>
  </div>
);
