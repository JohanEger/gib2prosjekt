import { Container, Box, Button, Typography, Paper } from "@mui/material";
import { blue } from "@mui/material/colors";
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
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "37.5rem",
            textAlign: "center",
            position: "relative",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Velkommen til
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center", // sentrerer boksen
              width: "100%",
            }}
          >
            <Box
              sx={{
                bgcolor: "#1e3a8a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "fit-content",
                px: 2.5,
                py: 1,
                borderRadius: "14px",
              }}
            >
              <img src="logo.png" alt="Logo" className="h-14 sm:h-24" />
            </Box>
          </Box>
          <Typography sx={{ mt: 2, mb: 2 }}>
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
