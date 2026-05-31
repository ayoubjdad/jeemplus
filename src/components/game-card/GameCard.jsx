import { Link } from "react-router-dom";
import { palette } from "../../themes/palette";
import PlayerCard from "../player-card/PlayerCard";
import Team from "../team/Team";
import styles from "./GameCard.module.scss";

const GameCard = ({ game = {}, players = [] }) => {
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
        return "Finished";
      case "inprogress":
        return "Live";
      case "notstarted":
        return "Scheduled";
      default:
        return game?.status?.description || "Unknown";
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
          <Team team={game.homeTeam} />

          <div className={styles.time}>
            <p className={styles.score}>{getScoreOrTime()}</p>
            <p
              className={styles.status}
              style={{
                borderColor:
                  game?.status?.type === "inprogress"
                    ? palette?.red?.main
                    : palette.gray.main,
                color:
                  game?.status?.type === "inprogress"
                    ? palette?.red?.main
                    : palette.gray.main,
              }}
            >
              {getStatusLabel()}
            </p>
          </div>

          <Team team={game.awayTeam} />
        </div>

        <div style={{ color: palette.gray.main }} className={styles.infos}>
          {game?.league?.name ?? game?.tournament?.uniqueTournament?.name}
          {game?.roundInfo?.round ? ` - ${game.roundInfo.round}` : ""}
        </div>
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
