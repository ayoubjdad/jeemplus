import { useMemo, useState } from "react";
import styles from "./GamesOfTheDay.module.scss";
import { topTeams } from "../../../data/Tournaments";
import DatePicker from "../../../components/date-picker/DatePicker";
import GameCard from "../../../components/game-card/GameCard";
import {
  stampGamesForViewerDate,
} from "../../../helpers/global.helper";
import { scheduledGamesTemplate } from "../../../data/static/scheduledGamesTemplate";

const isToday = (date, timestamp) => {
  const startTime = new Date(timestamp * 1000);
  return startTime.toLocaleDateString() === date.toLocaleDateString();
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

  const games = useMemo(
    () => stampGamesForViewerDate(scheduledGamesTemplate, date),
    [date]
  );

  const highlightedGames = useMemo(() => {
    const result = games
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

    if (result.length === 0) return games.slice(0, 10);

    return result;
  }, [games, date]);

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1>Matchs du jour</h1>
        {!hideDatePicker && <DatePicker date={date} setDate={setDate} />}
      </div>

      <div className={styles.container}>
        {highlightedGames?.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
