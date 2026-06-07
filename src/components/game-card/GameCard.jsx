import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PlayerCard from "../player-card/PlayerCard";
import Team from "../team/Team";
import styles from "./GameCard.module.scss";

const GameCard = ({ game = {}, players = [], hideLeagueLabel = false }) => {
  const { t } = useTranslation();

  const timeString = (timestamp) => {
    const startTime = new Date(timestamp * 1000);
    return startTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = () => {
    switch (game?.status?.type) {
      case "finished":
        return t("gameCard.finished");
      case "inprogress":
        return t("gameCard.live");
      case "notstarted":
        return t("gameCard.scheduled");
      default:
        return game?.status?.description || t("gameCard.unknown");
    }
  };

  const getStatusClass = () => {
    switch (game?.status?.type) {
      case "inprogress":
        return styles.statusLive;
      case "finished":
        return styles.statusFinished;
      case "notstarted":
        return styles.statusScheduled;
      default:
        return styles.statusDefault;
    }
  };

  const getScoreOrTime = () => {
    if (
      game?.status?.type === "finished" ||
      game?.status?.type === "inprogress"
    ) {
      return `${game.homeScore.display} - ${game.awayScore.display}`;
    }

    return timeString(game?.startTimestamp);
  };

  return (
    <div className={styles.card}>
      <Link className={styles.summaryLink} to={`/game/${game.id}`}>
        <div className={styles.matchHeader}>
          <Team team={game.homeTeam} fromGame />

          <div className={styles.time}>
            <p className={styles.score}>{getScoreOrTime()}</p>
            <p className={`${styles.status} ${getStatusClass()}`}>
              {getStatusLabel()}
            </p>
          </div>

          <Team team={game.awayTeam} fromGame />
        </div>

        {!hideLeagueLabel || game?.roundInfo?.round ? (
          <div className={styles.infos}>
            {!hideLeagueLabel
              ? (game?.league?.name ??
                game?.tournament?.uniqueTournament?.name)
              : null}
            {game?.roundInfo?.round
              ? hideLeagueLabel
                ? game.roundInfo.round
                : ` - ${game.roundInfo.round}`
              : null}
          </div>
        ) : null}
      </Link>

      {!players?.length ? null : (
        <div className={styles.playersList}>
          {players.map((playerObj, idx) => (
            <PlayerCard
              key={playerObj.player?.id ?? playerObj.id ?? idx}
              player={playerObj?.player ?? playerObj}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GameCard;
