import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import { Map } from "./components/Map";


function App() {
  /*
  const [response, setResponse] = useState<HealthResponse>();

  const getBackendApiStatus = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/health`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: HealthResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    getBackendApiStatus();
  }, []);
  */

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* resetter browser-stiler */}
      <BrowserRouter> 
      <Routes>
        <Route path="/" element={<Map/>} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
    {/* Kan fjerne/legge til denne sjekken etter behov: 
      <div style={{ textAlign: "center", padding: "10px" }}>
        <small>
          Backend status:{" "}
          {response ? JSON.stringify(response) : "Checking..."}
        </small>
      </div> 
      */}
    </ThemeProvider>
  );
}

export default App;
