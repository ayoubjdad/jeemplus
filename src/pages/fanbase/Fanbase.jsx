import { useState } from "react";
import { useTranslation } from "react-i18next";
import GamesOfTheDay from "../games/games-of-the-day/GamesOfTheDay";
import styles from "./Fanbase.module.scss";
import MoroccanPlayers from "../games/moroccan-players/MoroccanPlayers";
import DatePicker from "../../components/date-picker/DatePicker";
import BotolaStats from "../botola/stats/BotolaStats";
import logo from "../../assets/images/logo/chouftv.png";
import InteractiveScreen from "../interactive-screen/InteractiveScreen";
import WorldCupStandings from "./WorldCupStandings";
import LanguageSwitcher from "../../components/language-switcher/LanguageSwitcher";

export default function Fanbase() {
  const { t } = useTranslation();
  const [tabIndex, setTabIndex] = useState(0);
  const [matchDayDate, setMatchDayDate] = useState(() => new Date());

  const handleTabChange = (index) => {
    setTabIndex(index);
  };

  const tabs = [
    {
      label: t("tabs.matchesOfDay"),
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
      label: t("tabs.botolaPro"),
      component: <BotolaStats />,
    },
    {
      label: t("tabs.interactiveScreen"),
      component: <InteractiveScreen />,
    },
    {
      label: t("tabs.worldCup"),
      component: <WorldCupStandings />,
    },
  ];

  return (
    <section className={styles.main}>
      <header className={styles.header}>
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
        <div className={styles.headerRight}>
          <LanguageSwitcher />
          <img src={logo} alt="logo" />
        </div>
      </header>

      <div className={styles.content}>{tabs[tabIndex].component}</div>
    </section>
  );
}
