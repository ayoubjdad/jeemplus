import { useState } from "react";
import GamesOfTheDay from "../games/games-of-the-day/GamesOfTheDay";
import styles from "./Fanbase.module.scss";
import MoroccanPlayers from "../games/moroccan-players/MoroccanPlayers";
import BotolaStats from "../botola/stats/BotolaStats";
import logo from "../../assets/images/logo/fanBase.png";
import InteractiveScreen from "../interactive-screen/InteractiveScreen";

export default function Fanbase() {
  const [tabIndex, setTabIndex] = useState(2);

  const handleTabChange = (index) => {
    setTabIndex(index);
  };

  const tabs = [
    {
      label: "Matchs du jour",
      component: (
        <>
          <GamesOfTheDay />
          <MoroccanPlayers />
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
  ];

  return (
    <section className={styles.main}>
      <header className={styles.header}>
        <img src={logo} alt="logo" />
        <div className={styles.headerButtons}>
          {tabs.map((tab, index) => (
            <button
              className={styles.button}
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
