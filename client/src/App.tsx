import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import { HomePage } from "./pages/HomePage";
import { GeolocationProvider } from "./context/GeolocationContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import CalendarPage from "./pages/CalendarPage";

function AppRoutes() {
  const { user, loading } = useAuth();

// TA VEKK FØR MERGING, behold så lenge du ikke får loadet backend
  const DEV_AUTO_LOGIN = true;

  const devUser = {
    id: "dev-user",
    name: "Dev User",
    email: "dev@test.no",
  };

  const activeUser = user ?? (DEV_AUTO_LOGIN ? devUser : null);
//

  if (loading) return null;

  return (
    <Routes>
      {activeUser ? ( //og endre denne til user igjen
        <>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage/>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <GeolocationProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* resetter browser-stiler */}
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </GeolocationProvider>
    </AuthProvider>
  );
}

export default App;
