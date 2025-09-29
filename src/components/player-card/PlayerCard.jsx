import styles from "./PlayerCard.module.scss";

const PlayerCard = ({ player }) => {
  return (
    <div key={player.id} className={styles.playerCard}>
      {player.jerseyNumber && (
        <p className={styles.jerseyNumber}>{player.jerseyNumber}</p>
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
