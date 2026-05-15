import styles from "./Team.module.scss";
import {
  sofascoreImgProps,
  sofascoreTeamImageUrl,
} from "../../api/sofascoreImages";

const Team = ({ team, fromGame = false }) => {
  return (
    <div className={styles.team}>
      <div style={{ backgroundColor: "#0a3035" }} className={styles.teamImage}>
        <img
          {...sofascoreImgProps}
          src={sofascoreTeamImageUrl(team?.id)}
          alt={team?.name}
        />
      </div>
      <p className={styles.teamName} style={{ height: fromGame && "auto" }}>
        {team?.shortName}
      </p>
    </div>
  );
};

export default Team;
