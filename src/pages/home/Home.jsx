import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { makeStyles } from "@mui/styles";
import GamesOfTheDay from "../games/games-of-the-day/GamesOfTheDay";
import MoroccanPlayers from "../games/moroccan-players/MoroccanPlayers";
import { palette } from "../../themes/palette";
import BotolaStats from "../botola/stats/BotolaStats";

// Custom styles
const useStyles = makeStyles({
  root: {
    display: "flex",
    width: "100%",
    height: "100vh",
  },
  tabsRoot: {
    borderRight: "1px solid #ccc",
    backgroundColor: "#f5f5f5",
    minWidth: "200px",
  },
  tab: {
    textTransform: "none !important",
    fontFamily: "Roobert !important",
    alignItems: "flex-start !important",
    fontWeight: "bold",
    fontSize: "16px",
    width: "100% !important",
    "&.Mui-selected": {
      color: "#1976d2",
      backgroundColor: "#e3f2fd",
    },
    "&:hover": {
      color: "#1565c0",
      opacity: 1,
    },
  },
  tabPanel: {
    flexGrow: 1,
  },
});

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <div>{children}</div>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function Home() {
  const classes = useStyles();
  const [value, setValue] = React.useState(2);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box
      className={classes.root}
      style={{ backgroundColor: palette.gray.light }}
    >
      <Tabs
        orientation="vertical"
        value={value}
        onChange={handleChange}
        aria-label="sidebar tabs"
        className={classes.tabsRoot}
      >
        <Tab className={classes.tab} label="Matchs du jour" {...a11yProps(0)} />
        <Tab
          className={classes.tab}
          label="Internationaux Marocains"
          {...a11yProps(1)}
        />
        <Tab
          className={classes.tab}
          label="Statistiques Botola"
          {...a11yProps(2)}
        />
      </Tabs>

      <CustomTabPanel className={classes.tabPanel} value={value} index={0}>
        <GamesOfTheDay />
      </CustomTabPanel>
      <CustomTabPanel className={classes.tabPanel} value={value} index={1}>
        <MoroccanPlayers />
      </CustomTabPanel>
      <CustomTabPanel className={classes.tabPanel} value={value} index={2}>
        <BotolaStats />
      </CustomTabPanel>
    </Box>
  );
}
