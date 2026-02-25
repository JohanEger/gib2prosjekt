import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validate = () => {
        const newErrors: typeof errors = {};

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        console.log("Register submitted", { email, password });
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
                <Paper elevation={3} sx={{ p: 4, position: "relative" }}>
                    <Button
                        onClick={() => navigate("/")}
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

                    <Box component="form" onSubmit={handleSubmit} noValidate>
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
                        >
                            Opprett bruker
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
