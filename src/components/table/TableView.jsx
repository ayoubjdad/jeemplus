import styles from "./TableView.module.scss";

export default function TableView({ data, options, onTeamClick }) {
  return (
    <div className={styles.tableView}>
      <table className={styles.table}>
        <thead>
          <tr>
            {options.map((option, index) => (
              <th
                key={option.value || index}
                style={{
                  borderRadius:
                    index === 0
                      ? "60px 0 0 60px"
                      : index === options.length - 1
                      ? "0 60px 60px 0"
                      : 0,
                  textAlign:
                    option.value === "team" || option.value === "player"
                      ? "left"
                      : "center",
                }}
              >
                {option.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id}>
              {options.map((option, index) => {
                const value = option.value;

                // special case: position
                if (value === "#") {
                  return (
                    <td key={index} style={{ borderRadius: "60px 0 0 60px" }}>
                      <p
                        className={styles.position}
                        // style={{
                        //   backgroundColor:
                        //     row?.promotion?.text === "Champions League"
                        //       ? "#00db6a"
                        //       : row?.promotion?.text === "CAF Confederation Cup"
                        //       ? "#006431"
                        //       : row?.promotion?.text === "Relegation Playoffs"
                        //       ? "#f88686"
                        //       : row?.promotion?.text === "Relegation"
                        //       ? "#fe4040"
                        //       : "#1d2a2c",
                        // }}
                      >
                        {row.position || idx + 1}
                      </p>
                    </td>
                  );
                }

                // special case: team
                if (value === "team") {
                  return (
                    <td
                      key={index}
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        cursor: onTeamClick ? "pointer" : undefined,
                      }}
                    >
                      <img
                        src={`https://img.sofascore.com/api/v1/team/${row.team.id}/image`}
                        alt={row.team.name}
                        width="26"
                        height="26"
                        style={{ marginRight: 8 }}
                      />
                      <span className={styles.teamName}>
                        {row.team.fieldTranslations?.nameTranslation?.fr ||
                          row.team.name}
                      </span>
                    </td>
                  );
                }

                // special case: player
                if (value === "player") {
                  return (
                    <td key={index} style={{ textAlign: "left" }}>
                      {row[value].name ?? ""}
                    </td>
                  );
                }

                // default case: show the value dynamically
                return (
                  <td
                    key={index}
                    style={{
                      borderRadius:
                        index === options.length - 1 ? "0 60px 60px 0" : 0,
                      textAlign: "center",
                    }}
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
