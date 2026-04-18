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

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        phoneNumber?:
        string;
    }>({});
    const [serverError, setServerError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        const newErrors: typeof errors = {};

        if (!username) {
            newErrors.username = "Brukernavn kreves";
        } else if (username.length < 3) {
            newErrors.username = "Brukernavnet må ha minst 3 tegn";
        }

        if (!email) {
            newErrors.email = "Email kreves";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Ugyldig format for epost";
        }

        if (!password) {
            newErrors.password = "Passordet kreves";
        } else if (password.length < 6) {
            newErrors.password =
                "Passordet må inneholde minst 6 karakterer";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword =
                "Vennligst bekreft passordet";
        } else if (confirmPassword !== password) {
            newErrors.confirmPassword =
                "Passordene matcher ikke";
        }

        if (!phoneNumber) {
            newErrors.phoneNumber = "Telefonnummer kreves";
        } else if (!/^\+?[0-9\s-]{8,15}$/.test(phoneNumber)) {
            newErrors.phoneNumber = "Ugyldig telefonnummer";
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
            await register(username, email, password, phoneNumber);
            navigate("/");
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Noe gikk galt",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
                <Paper elevation={3} sx={{ p: 4, position: "relative" }}>
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

                    <Typography variant="h5" gutterBottom align="center">
                        Opprett bruker
                    </Typography>

                    {serverError && (
                        <Typography color="error" align="center" sx={{ mb: 1 }}>
                            {serverError}
                        </Typography>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <TextField
                            label="Brukernavn"
                            fullWidth
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            error={!!errors.username}
                            helperText={errors.username}
                        />

                        <TextField
                            label="Email"
                            fullWidth
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={!!errors.email}
                            helperText={errors.email}
                        />

                        <TextField
                            label="Telefonnummer"
                            fullWidth
                            margin="normal"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            error={!!errors.phoneNumber}
                            helperText={errors.phoneNumber}
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

                        <TextField
                            label="Bekreft Passord"
                            type="password"
                            fullWidth
                            margin="normal"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={submitting}
                        >
                            {submitting ? "Oppretter..." : "Opprett bruker"}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
