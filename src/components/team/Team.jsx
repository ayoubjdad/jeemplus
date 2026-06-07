import styles from "./Team.module.scss";
import { teamLogo } from "../../helpers/media.helpers";

const Team = ({ team, fromGame = false }) => {
  return (
    <div className={styles.team}>
      <div className={styles.teamImage}>
        <img src={teamLogo(team)} alt={team?.name} />
      </div>
      <p
        className={`${styles.teamName} ${
          fromGame ? styles.teamNameFromGame : ""
        }`}
      >
        {team?.shortName ?? team?.name}
      </p>
    </div>
  );
};

export default Team;
