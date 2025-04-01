import { QueryClient, QueryClientProvider } from "react-query";
import Home from "./pages/home/Home";
import { ThemeProvider } from "@mui/material";
import { theme } from "./themes/overrides";

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
