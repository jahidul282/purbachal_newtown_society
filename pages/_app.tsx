// pages/_app.tsx
import { AppProps } from "next/app";
import { ThemeModeProvider } from "@/contexts/ThemeContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeModeProvider>
      <Component {...pageProps} />
    </ThemeModeProvider>
  );
}
