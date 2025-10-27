import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import styles from "./MoroccanPlayers.module.scss";
import { gamesUrl } from "../../../api/data";
import { gamesFormatDate } from "../../../helpers/global.helper";
import { palette } from "../../../themes/palette";
import Loader from "../../../layouts/loader/Loader";
import GameCard from "../../../components/game-card/GameCard";
import { tournamentsPriority } from "../../../data/Tournaments";

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

export default function MoroccanPlayers() {
  const [date, setDate] = useState(new Date());

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games", date],
    queryFn: fetchGames,
    // ...options,
  });

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
    <section
      className={styles.main}
      style={{ backgroundColor: palette.gray.light }}
    >
      <h1>Internationaux</h1>
      <div className={styles.container}>
        {enrichedGames.map((game) => {
          const moroccanPlayers = getMoroccanPlayers(
            game.homeTeam.players || [],
            game.awayTeam.players || []
          );
          if (moroccanPlayers.length === 0) return null;

          return <GameCard game={game.game} players={moroccanPlayers} />;
        })}
      </div>
    </section>
  );
}
