import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      light: "#9b4dc4",
      main: "#7b2fa0",
      dark: "#5a1f75",
      contrastText: "#ffffff",
    },
    secondary: {
      light: "#ff8c33",
      main: "#ff6b00",
      dark: "#e55a00",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f6f6f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#16161f",
      secondary: "#6c6c7a",
    },
    error: {
      main: "#e23744",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roobert", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f6f6f8",
          color: "#16161f",
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          color: "#16161f",
          width: "248px",
          boxShadow: "none",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #ecedf2",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          gap: "8px",
          color: "white",
          display: "flex",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "none",
          padding: "9px 18px",
          width: "fit-content",
          fontFamily: "inherit",
          textTransform: "none",
          borderRadius: "999px",
          backgroundColor: "#7b2fa0",
          "&:hover": {
            backgroundColor: "#5a1f75",
            boxShadow: "none",
          },
        },
        startIcon: { fontSize: "16px", marginRight: "0px", marginLeft: "0px" },
        endIcon: { fontSize: "16px", marginRight: "0px", marginLeft: "0px" },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          padding: "0px",
          borderRadius: "12px",
        },
        input: {
          fontFamily: "Alexandria",
          padding: "10px 12px",
          fontSize: "14px",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { width: "100%" },
      },
    },
    MuiInputBase: {
      root: { padding: 0 },
    },

    MuiAutocomplete: {
      styleOverrides: {
        root: { width: "100% !important" },
        inputRoot: {
          padding: "0px",
          "& .MuiOutlinedInput-root": { padding: "0px" },
        },
        endAdornment: { top: "auto", height: "100%", transform: "none" },
        popupIndicator: { padding: 0, height: "100%" },
        paper: {
          boxShadow: "0 8px 28px rgba(22, 22, 31, 0.06)",
          borderRadius: "14px",
          marginTop: "6px",
          border: "1px solid #ecedf2 !important",
        },
        option: {
          color: "#16161f",
          fontSize: "14px",
          fontFamily: "Alexandria",
          '&[aria-selected="true"]': {
            backgroundColor: "rgba(123, 47, 160, 0.1)",
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontFamily: "inherit", fontSize: "12px" },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: "0px" },
        indicator: { backgroundColor: "#7b2fa0", height: "2px" },
        flexContainer: { justifyContent: "space-between" },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          width: "40px",
          minWidth: "40px",
          padding: "8px 16px",
          color: "#6c6c7a",
          "&.Mui-selected": { color: "#7b2fa0" },
        },
      },
    },

    MuiPaper: {
      root: { boxShadow: "none !important" },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          overflow: "hidden",
          borderRadius: "16px",
          borderCollapse: "inherit",
          backgroundColor: "#ffffff",
          border: "1px solid #ecedf2",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: "Alexandria",
          padding: "12px 24px",
          fontSize: "12px",
        },
        head: {
          backgroundColor: "#fbfbfd",
          fontWeight: "bold",
          color: "#16161f",
        },
        body: { backgroundColor: "#ffffff" },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)": { backgroundColor: "#fbfbfd" },
          "&:hover": { backgroundColor: "rgba(123, 47, 160, 0.04)" },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: "#7b2fa0",
          "&.Mui-checked": { color: "#7b2fa0" },
          "&.Mui-checked + .MuiSwitch-track": { backgroundColor: "#9b4dc4" },
        },
        track: { backgroundColor: "#dcdce4", opacity: 1 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#16161f",
          fontFamily: "inherit",
          fontSize: "12px",
          borderRadius: "8px",
          padding: "6px 10px",
        },
        arrow: { color: "#16161f" },
      },
    },
  },
});
