import { ThemeProvider } from "@mui/material";
import { theme } from "./themes/overrides";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Fanbase from "./pages/fanbase/Fanbase";
import GameDetail from "./pages/game-detail/GameDetail";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Fanbase />} />
            <Route path="/game/:eventId" element={<GameDetail />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
