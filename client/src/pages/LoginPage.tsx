import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email kreves";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Ugyldig format for epost";
    }

    if (!password) {
      newErrors.password = "Passord kreves";
    } else if (password.length < 6) {
      newErrors.password = "Passordet må inneholde minst 6 karakterer";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 6,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%", position: "relative" }}>
          <Button
            onClick={() => navigate("/welcome")}
            variant="text"
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              minWidth: 0,
              padding: 0,
            }}
          >
            <ArrowBackIcon />
          </Button>

          <Typography variant="h5" align="center" gutterBottom>
            Logg inn
          </Typography>

          {serverError && (
            <Typography color="error" align="center" sx={{ mb: 1 }}>
              {serverError}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />

            <TextField
              label="Passord"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={submitting}
            >
              {submitting ? "Logger inn..." : "Logg inn"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
