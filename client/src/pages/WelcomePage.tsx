import { Container, Box, Button, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 6,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: "37.5rem", textAlign: "center", position: "relative" }}>

                    <Typography variant="h6" gutterBottom>
                        Velkommen til
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                        Hybridas UtstyrsApp
                        {/* "[Appnavn]"*/}
                    </Typography>

                    <Box
                        component="img"
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9le_ZsvDyNqb6UF_hmlLpbH3oDgxR7Lj04g&s"
                        alt="Logo"
                        sx={{
                            width: 80,
                            height: "auto",
                            display: "block",
                            mx: "auto",
                            mb: 2,
                            borderRadius: "1.75em",
                            filter: "blur(0px)"
                        }}
                    />

                    <Typography sx={{ mb: 2 }}>
                        Logg inn eller registrer bruker:
                    </Typography>

                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ mb: 2 }}
                        onClick={() => navigate("/login")}
                    >
                        Logg inn
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate("/register")}
                    >
                        Opprett bruker
                    </Button>
                </Paper>
            </Box>
        </Container>
    );
}
