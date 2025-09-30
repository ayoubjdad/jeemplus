import { Box } from "@mui/material";
import { gamesFormatDate } from "../../helpers/global.helper";
import styles from "./DatePicker.module.scss";

const DatePicker = ({ date, setDate }) => {
  const dateString = gamesFormatDate(date).split("-");
  const month = dateString[1];
  const day = dateString[2];
  return (
    <div className={styles.datePicker}>
      <Box
        component="i"
        className={`fi fi-rr-angle-left ${styles.arrow}`}
        onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}
      />
      <Box component="i" className="fi fi-rr-calendar-day" />
      <p>
        {day}/{month}
      </p>
      <Box
        component="i"
        className={`fi fi-rr-angle-right ${styles.arrow}`}
        onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}
      />
    </div>
  );
};

export default DatePicker;
