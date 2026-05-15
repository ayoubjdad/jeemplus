import { Tooltip } from "@mui/material";
import styles from "./PlayerCard.module.scss";
import {
  sofascoreImgProps,
  sofascorePlayerImageUrl,
} from "../../api/sofascoreImages";

const PlayerCard = ({ player }) => (
  <Tooltip title={player?.name}>
    <div key={player.id} className={styles.playerCard}>
      <img
        {...sofascoreImgProps}
        src={sofascorePlayerImageUrl(player.id)}
        alt={player.name}
        className={styles.playerImage}
      />
    </div>
  </Tooltip>
);

export default PlayerCard;
