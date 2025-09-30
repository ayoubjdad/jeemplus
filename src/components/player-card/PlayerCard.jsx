import { palette } from "../../themes/palette";
import styles from "./PlayerCard.module.scss";

const PlayerCard = ({ player }) => {
  return (
    <div
      key={player.id}
      className={styles.playerCard}
      style={{ backgroundColor: palette.gray.light }}
    >
      {player.jerseyNumber && (
        <p
          className={styles.jerseyNumber}
          style={{ backgroundColor: palette.blue.light }}
        >
          {player.jerseyNumber}
        </p>
      )}
      <img
        src={`https://img.sofascore.com/api/v1/player/${player.id}/image`}
        alt={player.name}
        className={styles.playerImage}
      />
      <p className={styles.playerName}>{player.name}</p>
    </div>
  );
};

export default PlayerCard;
