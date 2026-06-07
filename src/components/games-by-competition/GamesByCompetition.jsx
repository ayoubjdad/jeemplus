import styles from "./GamesByCompetition.module.scss";

export default function GamesByCompetition({ groups, renderItem }) {
  if (!groups?.length) return null;

  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group}>
          <header className={styles.groupHeader}>
            {group.logo ? (
              <img className={styles.groupLogo} src={group.logo} alt="" />
            ) : (
              <span className={styles.groupLogoFallback} aria-hidden />
            )}
            <div className={styles.groupMeta}>
              <h2 className={styles.groupTitle}>{group.name}</h2>
              {group.country ? (
                <span className={styles.groupCountry}>{group.country}</span>
              ) : null}
            </div>
            <span className={styles.groupCount}>{group.items.length}</span>
          </header>

          <div className={styles.gamesGrid}>
            {group.items.map((item) => renderItem(item, group))}
          </div>
        </section>
      ))}
    </div>
  );
}
