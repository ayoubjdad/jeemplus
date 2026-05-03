import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import styles from "./MoroccanPlayers.module.scss";
import { gamesUrl } from "../../../api/data";
import { getSofascoreApiV1Base } from "../../../api/sofascoreBase";
import { gamesFormatDate } from "../../../helpers/global.helper";
import Loader from "../../../layouts/loader/Loader";
import GameCard from "../../../components/game-card/GameCard";
import { tournamentsPriority } from "../../../data/Tournaments";
import DatePicker from "../../../components/date-picker/DatePicker";

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
      `${getSofascoreApiV1Base()}/team/${teamId}/players`
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

export default function MoroccanPlayers({
  date: controlledDate,
  setDate: controlledSetDate,
  hideDatePicker = false,
}) {
  const [internalDate, setInternalDate] = useState(new Date());
  const isControlled =
    controlledDate !== undefined && controlledSetDate !== undefined;
  const date = isControlled ? controlledDate : internalDate;
  const setDate = isControlled ? controlledSetDate : setInternalDate;

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games", date],
    queryFn: fetchGames,
    // ...options,
  });

  const { data: enrichedGames = [], isLoading: playersLoading } = useQuery({
    queryKey: ["enrichedGames", games, gamesFormatDate(date)],
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
      <div className={styles.header}>
        <h1>Internationaux</h1>
        {!hideDatePicker && <DatePicker date={date} setDate={setDate} />}
      </div>

      <div className={styles.container}>
        {enrichedGames.map((game) => {
          const moroccanPlayers = getMoroccanPlayers(
            game.homeTeam.players || [],
            game.awayTeam.players || []
          );
          if (moroccanPlayers.length === 0) return null;

          return (
            <GameCard
              key={game.id}
              game={game.game}
              players={moroccanPlayers}
            />
          );
        })}
      </div>
    </section>
  );
}
