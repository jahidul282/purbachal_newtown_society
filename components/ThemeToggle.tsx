// components/ThemeToggle.tsx
import * as React from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import { useThemeMode } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { toggleColorMode } = useThemeMode();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Tooltip title={isDark ? "Switch to light" : "Switch to dark"}>
      <IconButton onClick={toggleColorMode} color="inherit">
        {isDark ? <LightModeRounded /> : <DarkModeRounded />}
      </IconButton>
    </Tooltip>
  );
}
