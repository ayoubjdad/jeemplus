import styles from "./TableView.module.scss";
import { teamLogo } from "../../helpers/media.helpers";

function thClass(index, total, option) {
  const classes = [];
  if (index === 0) classes.push(styles.thFirst);
  if (index === total - 1) classes.push(styles.thLast);
  if (option.value === "team" || option.value === "player") {
    classes.push(styles.thLeft);
  }
  return classes.join(" ");
}

export default function TableView({ data, options, onTeamClick }) {
  return (
    <div className={styles.tableView}>
      <table className={styles.table}>
        <thead>
          <tr>
            {options.map((option, index) => (
              <th
                key={option.value || index}
                className={thClass(index, options.length, option)}
              >
                {option.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id ?? idx}>
              {options.map((option, index) => {
                const value = option.value;

                if (value === "#") {
                  return (
                    <td key={index} className={styles.tdFirst}>
                      <p className={styles.position}>
                        {row.position || idx + 1}
                      </p>
                    </td>
                  );
                }

                if (value === "team") {
                  return (
                    <td
                      key={index}
                      className={`${styles.tdLeft} ${
                        onTeamClick ? styles.tdTeam : styles.tdTeamStatic
                      }`}
                      role={onTeamClick ? "button" : undefined}
                      tabIndex={onTeamClick ? 0 : undefined}
                      onClick={
                        onTeamClick
                          ? (e) => {
                              e.stopPropagation();
                              onTeamClick(row);
                            }
                          : undefined
                      }
                      onKeyDown={
                        onTeamClick
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onTeamClick(row);
                              }
                            }
                          : undefined
                      }
                    >
                      <span className={styles.teamCell}>
                        <img
                          className={styles.teamLogo}
                          src={teamLogo(row.team)}
                          alt={row.team.name}
                          width="26"
                          height="26"
                        />
                        <span className={styles.teamName}>{row.team.name}</span>
                      </span>
                    </td>
                  );
                }

                if (value === "player") {
                  return (
                    <td key={index} className={styles.tdLeft}>
                      {row[value]?.name ?? ""}
                    </td>
                  );
                }

                return (
                  <td
                    key={index}
                    className={index === options.length - 1 ? styles.tdLast : ""}
                  >
                    {row[value] ?? "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
