import { Box } from "@mui/material";
import { gamesFormatDate } from "../../helpers/global.helper";
import styles from "./DatePicker.module.scss";

const shiftDay = (d, deltaDays) => {
  const next = new Date(d);
  next.setDate(next.getDate() + deltaDays);
  return next;
};

const DatePicker = ({ date, setDate }) => {
  const dateString = gamesFormatDate(date).split("-");
  const month = dateString[1];
  const day = dateString[2];

  const handleNativeChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    const [y, m, d] = value.split("-").map(Number);
    setDate(new Date(y, m - 1, d));
  };

  return (
    <div className={styles.datePicker}>
      <Box
        component="i"
        type="button"
        aria-label="Jour précédent"
        className={`fi fi-rr-angle-left ${styles.arrow}`}
        onClick={() => setDate(shiftDay(date, -1))}
      />
      <label className={styles.datePick}>
        <span className={styles.dateDisplay}>
          {day}/{month}
        </span>
        <input
          type="date"
          className={styles.nativeDateInput}
          value={gamesFormatDate(date)}
          onChange={handleNativeChange}
          aria-label="Choisir une date"
        />
      </label>
      <Box
        component="i"
        type="button"
        aria-label="Jour suivant"
        className={`fi fi-rr-angle-right ${styles.arrow}`}
        onClick={() => setDate(shiftDay(date, 1))}
      />
    </div>
  );
};

export default DatePicker;
