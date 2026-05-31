import { Tooltip } from "@mui/material";
import styles from "./PlayerCard.module.scss";
import { playerPhoto } from "../../helpers/media.helpers";

const PlayerCard = ({ player }) => (
  <Tooltip title={player?.name}>
    <div key={player.id} className={styles.playerCard}>
      <img
        src={playerPhoto(player)}
        alt={player.name}
        className={styles.playerImage}
      />
    </div>
  </Tooltip>
);

export default PlayerCard;
