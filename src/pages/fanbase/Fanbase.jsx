import { useState } from "react";
import GamesOfTheDay from "../games/games-of-the-day/GamesOfTheDay";
import styles from "./Fanbase.module.scss";
import MoroccanPlayers from "../games/moroccan-players/MoroccanPlayers";
import DatePicker from "../../components/date-picker/DatePicker";
import BotolaStats from "../botola/stats/BotolaStats";
import logo from "../../assets/images/logo/fanBase.png";
import InteractiveScreen from "../interactive-screen/InteractiveScreen";
import WorldCupStandings from "./WorldCupStandings";

export default function Fanbase() {
  const [tabIndex, setTabIndex] = useState(2);
  const [matchDayDate, setMatchDayDate] = useState(() => new Date());

  const handleTabChange = (index) => {
    setTabIndex(index);
  };

  const tabs = [
    {
      label: "Matchs du jour",
      component: (
        <>
          <div className={styles.matchDayToolbar}>
            <DatePicker date={matchDayDate} setDate={setMatchDayDate} />
          </div>
          <GamesOfTheDay
            date={matchDayDate}
            setDate={setMatchDayDate}
            hideDatePicker
          />
          <MoroccanPlayers
            date={matchDayDate}
            setDate={setMatchDayDate}
            hideDatePicker
          />
        </>
      ),
    },
    {
      label: "Botola Pro",
      component: <BotolaStats />,
    },
    {
      label: "Écran interactif",
      component: <InteractiveScreen />,
    },
    {
      label: "Coupe du monde",
      component: <WorldCupStandings />,
    },
  ];

  return (
    <section className={styles.main}>
      <header className={styles.header}>
        <img src={logo} alt="logo" />
        <div className={styles.headerButtons}>
          {tabs.map((tab, index) => (
            <button
              className={
                styles.button +
                (tabIndex === index ? " " + styles.buttonActive : "")
              }
              key={index}
              onClick={() => handleTabChange(index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.content}>{tabs[tabIndex].component}</div>
    </section>
  );
}
