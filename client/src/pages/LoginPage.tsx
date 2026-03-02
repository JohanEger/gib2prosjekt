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

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    console.log("Login submitted", { email, password });
    // TODO senere: Sende request til backend her
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
              onClick={() => navigate("/")}
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Logg inn
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
