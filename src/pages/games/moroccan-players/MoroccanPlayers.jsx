import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./MoroccanPlayers.module.scss";
import { gamesFormatDate } from "../../../helpers/global.helper";
import Loader from "../../../layouts/loader/Loader";
import GameCard from "../../../components/game-card/GameCard";
import DatePicker from "../../../components/date-picker/DatePicker";
import { getMoroccanPlayersForDate } from "../../../api/football/services/playersService";

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

  const { data: enrichedGames = [], isLoading } = useQuery({
    queryKey: ["moroccanPlayers", gamesFormatDate(date)],
    queryFn: () => getMoroccanPlayersForDate(date),
    staleTime: 60_000,
  });

  if (isLoading) return <Loader />;

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1>Internationaux</h1>
        {!hideDatePicker && <DatePicker date={date} setDate={setDate} />}
      </div>

      <div className={styles.container}>
        {enrichedGames.length === 0 ? (
          <p className={styles.empty}>
            Aucun match avec joueurs marocains pour cette date.
          </p>
        ) : (
          enrichedGames.map((item) => (
            <GameCard
              key={item.id}
              game={item.game}
              players={item.moroccanPlayers}
            />
          ))
        )}
      </div>
    </section>
  );
}
