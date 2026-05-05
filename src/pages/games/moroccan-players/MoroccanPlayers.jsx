import { useMemo, useState } from "react";
import styles from "./MoroccanPlayers.module.scss";
import GameCard from "../../../components/game-card/GameCard";
import DatePicker from "../../../components/date-picker/DatePicker";
import {
  stampMoroccanEnrichedGames,
} from "../../../helpers/global.helper";
import { moroccanEnrichedGamesTemplate } from "../../../data/static/moroccanEnrichedGamesTemplate";

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

  const enrichedGames = useMemo(
    () => stampMoroccanEnrichedGames(moroccanEnrichedGamesTemplate, date),
    [date]
  );

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
