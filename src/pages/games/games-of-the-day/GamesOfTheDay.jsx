import { useMemo, useState } from "react";
import styles from "./GamesOfTheDay.module.scss";
import { useQuery } from "@tanstack/react-query";
import { topTeams } from "../../../data/Tournaments";
import DatePicker from "../../../components/date-picker/DatePicker";
import GameCard from "../../../components/game-card/GameCard";
import { palette } from "../../../themes/palette";
import Loader from "../../../layouts/loader/Loader";
import { gamesFormatDate } from "../../../helpers/global.helper";
import { gamesUrl } from "../../../api/data";
import axios from "axios";

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

export default function GamesOfTheDay() {
  const [date, setDate] = useState(new Date());

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["games", date],
    queryFn: fetchGames,
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

  if (gamesLoading) return <Loader />;

  return (
    <section className={styles.main}>
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
    </section>
  );
}
