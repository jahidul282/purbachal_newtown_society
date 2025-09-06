// context/ThemeContext.tsx
import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from "@mui/material";
import { getDesignTokens } from "@/theme/theme";

type ThemeMode = "light" | "dark";
interface ThemeContextType { mode: ThemeMode; toggleColorMode: () => void; }

const ThemeModeContext = createContext<ThemeContextType>({ mode: "light", toggleColorMode: () => {} });
export const useThemeMode = () => useContext(ThemeModeContext);

const STORAGE_KEY = "theme-mode";

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  // Ask system preference once (SSR-safe: default to false which means light)
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", { noSsr: true });

  const [mode, setMode] = useState<ThemeMode>("light");

  // Initialize from localStorage OR system
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
    if (saved === "light" || saved === "dark") setMode(saved);
    else setMode(prefersDark ? "dark" : "light");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersDark]);

  const toggleColorMode = () => {
    setMode(prev => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
