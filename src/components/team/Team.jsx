import styles from "./Team.module.scss";
import { teamLogo } from "../../helpers/media.helpers";

const Team = ({ team, fromGame = false }) => {
  return (
    <div className={styles.team}>
      <div style={{ backgroundColor: "#0a3035" }} className={styles.teamImage}>
        <img src={teamLogo(team)} alt={team?.name} />
      </div>
      <p className={styles.teamName} style={{ height: fromGame && "auto" }}>
        {team?.shortName ?? team?.name}
      </p>
    </div>
  );
};

export default Team;
