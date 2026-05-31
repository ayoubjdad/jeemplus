import { useMemo, useState } from "react";
import styles from "./GamesOfTheDay.module.scss";
import { useQuery } from "@tanstack/react-query";
import DatePicker from "../../../components/date-picker/DatePicker";
import GameCard from "../../../components/game-card/GameCard";
import Loader from "../../../layouts/loader/Loader";
import { gamesFormatDate } from "../../../helpers/global.helper";
import {
  getFixturesByDate,
  filterHighlightedGames,
} from "../../../api/football/services/fixturesService";

const fetchGames = async ({ queryKey }) => {
  const [, dateStr] = queryKey;
  try {
    const fixtures = await getFixturesByDate(dateStr);
    return filterHighlightedGames(fixtures);
  } catch (error) {
    console.error("Error fetching games:", error);
    return [];
  }
};

export default function GamesOfTheDay({
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
    queryKey: ["games", gamesFormatDate(date)],
    queryFn: fetchGames,
    staleTime: 60_000,
  });

  const highlightedGames = useMemo(() => games, [games]);

  if (gamesLoading) return <Loader />;

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1>Matchs du jour</h1>
        {!hideDatePicker && <DatePicker date={date} setDate={setDate} />}
      </div>

      <div className={styles.container}>
        {highlightedGames.length === 0 ? (
          <p className={styles.empty}>Aucun match pour cette date.</p>
        ) : (
          highlightedGames.map((game) => <GameCard key={game.id} game={game} />)
        )}
      </div>
    </section>
  );
}
