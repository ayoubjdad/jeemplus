import React, { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueries } from "@tanstack/react-query";
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

// Fetch Games
const fetchGames = async (date) => {
  try {
    const url = gamesUrl + gamesFormatDate(date);
    const { data } = await axios.get(url);
    return data?.events || [];
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    throw error;
  }
};

// Fetch Team Players
const fetchTeamPlayers = async (teamId) => {
  try {
    const { data } = await axios.get(
      `https://www.sofascore.com/api/v1/team/${teamId}/players`
    );
    return data || {};
  } catch (error) {
    console.error(`❌ Error fetching team ${teamId}:`, error);
    throw error;
  }
};

export default function Home() {
  const [date, setDate] = useState(new Date());

  // Fetch games using TanStack Query
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games", date],
    queryFn: () => fetchGames(date),
  });

  // Fetch all team players for games
  const teamQueries = useQueries({
    queries: games.flatMap((game) => [
      {
        queryKey: ["team", game.homeTeam.id],
        queryFn: () => fetchTeamPlayers(game.homeTeam.id),
        staleTime: 600000,
      },
      {
        queryKey: ["team", game.awayTeam.id],
        queryFn: () => fetchTeamPlayers(game.awayTeam.id),
        staleTime: 600000,
      },
    ]),
  });

  // Extract fetched player data
  const enrichedGames = useMemo(() => {
    return games.map((game) => {
      const homeTeamData =
        teamQueries.find((q) => q.queryKey[1] === game.homeTeam.id)?.data || {};
      const awayTeamData =
        teamQueries.find((q) => q.queryKey[1] === game.awayTeam.id)?.data || {};
      return {
        ...game,
        homeTeam: { ...game.homeTeam, ...homeTeamData },
        awayTeam: { ...game.awayTeam, ...awayTeamData },
      };
    });
  }, [games, teamQueries]);

  // Filter highlighted games
  const highlightedGames = useMemo(() => {
    return games
      .filter(
        (game) =>
          tournamentsPriority.some(
            (t) => t.id === game.tournament.uniqueTournament.id
          ) && isToday(date, game.startTimestamp)
      )
      .sort(
        (a, b) =>
          a.tournament.uniqueTournament.id - b.tournament.uniqueTournament.id
      );
  }, [games, date]);

  if (gamesLoading) return <Loader />;

  return (
    <section className={styles.main}>
      <DatePicker date={date} setDate={setDate} />
      <h4>أهم مباريات اليوم</h4>
      <div className={styles.container}>
        {highlightedGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}

const GameCard = ({ game }) => {
  const timeString = (timestamp) => {
    const startTime = new Date(timestamp * 1000);
    return startTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.matchHeader}>
      <Team team={game.homeTeam} />
      <div className={styles.time}>
        <img
          src={`https://img.sofascore.com/api/v1/unique-tournament/${game?.tournament?.uniqueTournament?.id}/image`}
          alt={game?.tournament?.uniqueTournament?.name}
        />
        <h5>{timeString(game.startTimestamp)}</h5>
      </div>
      <Team team={game.awayTeam} />
    </div>
  );
};

const Team = ({ team }) => (
  <div className={styles.team}>
    <img
      src={`https://img.sofascore.com/api/v1/team/${team?.id}/image`}
      alt={team?.name}
      className={styles.teamImage}
    />
    <p className={styles.teamName}>{team?.name}</p>
  </div>
);

const DatePicker = ({ date, setDate }) => {
  return (
    <div className={styles.datePicker}>
      <Box
        component="i"
        className={`fi fi-rr-angle-left ${styles.arrow}`}
        onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}
      />
      <Box component="i" className="fi fi-rr-calendar-day" />
      <p>{gamesFormatDate(date)}</p>
      <Box
        component="i"
        className={`fi fi-rr-angle-right ${styles.arrow}`}
        onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}
      />
    </div>
  );
};
