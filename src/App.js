import { ThemeProvider } from "@mui/material";
import { theme } from "./themes/overrides";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Fanbase from "./pages/fanbase/Fanbase";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Fanbase />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
