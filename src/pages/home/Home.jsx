import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gamesUrl } from "../../api/data";
import { gamesFormatDate } from "../../helpers/global.helper";
import styles from "./Home.module.scss";
import { topTeams, tournamentsPriority } from "../../data/Tournaments";
import Loader from "../../layouts/loader/Loader";
import { palette } from "../../themes/palette";
import GameCard from "../../components/game-card/GameCard";
import DatePicker from "../../components/date-picker/DatePicker";
import { fetchWithProxy } from "../../api/proxy";

const isToday = (date, timestamp) => {
  const startTime = new Date(timestamp * 1000);
  return startTime.toLocaleDateString() === date.toLocaleDateString();
};

const fetchGames = async ({ queryKey }) => {
  const [, date] = queryKey;
  try {
    const response = await fetchWithProxy(
      `${gamesUrl}${gamesFormatDate(date)}`
    );
    return response?.events || [];
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    return [];
  }
};

const fetchTeamPlayers = async ({ queryKey }) => {
  const [, teamId] = queryKey;
  try {
    const response = await fetchWithProxy(
      `https://www.sofascore.com/api/v1/team/${teamId}/players`
    );
    return response || {};
  } catch {
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
    <section
      className={styles.main}
      style={{ backgroundColor: palette.gray.light }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1>Matchs du jour</h1>
        <DatePicker date={date} setDate={setDate} />
      </div>

      <div className={styles.container}>
        {highlightedGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

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
