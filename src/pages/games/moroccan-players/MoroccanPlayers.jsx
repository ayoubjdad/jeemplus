import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import styles from "./MoroccanPlayers.module.scss";
import { gamesFormatDate } from "../../../helpers/global.helper";
import { groupGamesByCompetition } from "../../../helpers/groupGamesByCompetition";
import Loader from "../../../layouts/loader/Loader";
import GameCard from "../../../components/game-card/GameCard";
import GamesByCompetition from "../../../components/games-by-competition/GamesByCompetition";
import DatePicker from "../../../components/date-picker/DatePicker";
import { getMoroccanPlayersForDate } from "../../../api/football/services/playersService";

export default function MoroccanPlayers({
  date: controlledDate,
  setDate: controlledSetDate,
  hideDatePicker = false,
}) {
  const { t } = useTranslation();
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

  const competitionGroups = useMemo(
    () => groupGamesByCompetition(enrichedGames, (item) => item.game),
    [enrichedGames],
  );

  if (isLoading) return <Loader />;

  return (
    <section className={styles.main}>
      <div className={styles.header}>
        <h1>{t("games.internationalsTitle")}</h1>
        {!hideDatePicker && <DatePicker date={date} setDate={setDate} />}
      </div>

      <div className={styles.container}>
        {competitionGroups.length === 0 ? (
          <p className={styles.empty}>{t("games.internationalsEmpty")}</p>
        ) : (
          <GamesByCompetition
            groups={competitionGroups}
            renderItem={(item) => (
              <GameCard
                key={item.id}
                game={item.game}
                players={item.moroccanPlayers}
                hideLeagueLabel
              />
            )}
          />
        )}
      </div>
    </section>
  );
}
