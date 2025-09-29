import { palette } from "../../themes/palette";
import styles from "./Team.module.scss";

const Team = ({ team, fromGame = false }) => {
  return (
    <div className={styles.team}>
      <div
        style={{ backgroundColor: palette.gray.light }}
        className={styles.teamImage}
      >
        <img
          src={`https://img.sofascore.com/api/v1/team/${team?.id}/image`}
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
