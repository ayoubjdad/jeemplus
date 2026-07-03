import { useMemo } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { useTranslation } from "react-i18next";
import { theme as baseTheme } from "./themes/overrides";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Fanbase from "./pages/fanbase/Fanbase";
import GameDetail from "./pages/game-detail/GameDetail";
import { queryClient } from "./api/queryClient";
import { getDirection } from "./i18n";
import Landing from "./pages/landing/Landing";

const ltrCache = createCache({ key: "mui", stylisPlugins: [prefixer] });
const rtlCache = createCache({
  key: "mui-rtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

function App() {
  const { i18n } = useTranslation();
  const direction = getDirection(i18n.language);

  const theme = useMemo(
    () => createTheme(baseTheme, { direction }),
    [direction]
  );
  const cache = direction === "rtl" ? rtlCache : ltrCache;

  return (
    <CacheProvider value={cache}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/game/:eventId" element={<GameDetail />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
}

export default App;
