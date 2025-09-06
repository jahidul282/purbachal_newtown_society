// theme.ts
import { createTheme, ThemeOptions } from "@mui/material/styles";

export const getDesignTokens = (mode: "light" | "dark"): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: {
            main: "#003366",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#b22234", // Patriotic Red
            contrastText: "#ffffff",
          },
          background: {
            default: "#f8f9fa", // Light neutral background
            paper: "#ffffff",
          },
          text: {
            primary: "#1a1a1a",
            secondary: "#555555",
          },
        }
      : {
          primary: {
            main: "#00509e", // Slightly brighter blue for dark mode
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#d72638", // Brighter red in dark mode for visibility
            contrastText: "#ffffff",
          },
          background: {
            default: "#121212",
            paper: "#1e1e1e",
          },
          text: {
            primary: "#f5f5f5",
            secondary: "#bdbdbd",
          },
        }),
  },
  typography: {
    fontFamily: `'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h3: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: "none", // Keeps political brand titles cleaner
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999, // Rounded political buttons
          padding: "6px 20px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

const theme = createTheme(getDesignTokens("light"));

export default theme;
