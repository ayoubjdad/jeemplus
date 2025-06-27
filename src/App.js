import Home from "./pages/home/Home";
import { ThemeProvider } from "@mui/material";
import { theme } from "./themes/overrides";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Home />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
