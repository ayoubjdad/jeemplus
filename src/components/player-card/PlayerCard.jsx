import { Tooltip } from "@mui/material";
import styles from "./PlayerCard.module.scss";

const PlayerCard = ({ player }) => (
  <Tooltip title={player?.name}>
    <div key={player.id} className={styles.playerCard}>
      <img
        src={`https://img.sofascore.com/api/v1/player/${player.id}/image`}
        alt={player.name}
        className={styles.playerImage}
      />
    </div>
  </Tooltip>
);

export default PlayerCard;
