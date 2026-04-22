import {
  Paper,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Typography,
  Button,
  Box,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddressSearch from "@/components/calendar/AddressSearchBox";
import { API_BASE } from "@/apiBase";
import { useNavigate } from "react-router-dom";
type Coordinates = {
  lat: number;
  lng: number;
};

export default function RegisterEquipment() {
  const [committeeNames, setCommitteeNames] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [committee, setCommittee] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [registeredName, setRegisteredName] = useState<string>("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChangeCommittee = (event: SelectChangeEvent) => {
    setCommittee(event.target.value);
  };
  const navigate = useNavigate();

  const handleGoBackToHomePage = () => {
    navigate("/", {});
  };

  const isFormValid =
    name.trim() !== "" &&
    type.trim() !== "" &&
    description.trim() !== "" &&
    committee !== "" &&
    coords !== null;

  const handleRegister = async () => {
    if (!coords) return;

    const register = {
      name,
      description,
      type,
      committee: committee.toLowerCase(),
      latitude: coords.lat,
      longitude: coords.lng,
    };

    try {
      const res = await fetch(`${API_BASE}/equipment/register_equipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(register),
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("Backend error:", text);
        let detail = "Kunne ikke lagre utstyret.";
        try {
          const parsed = JSON.parse(text);
          if (typeof parsed?.detail === "string") detail = parsed.detail;
        } catch {
          // body var ikke JSON – behold default-meldingen
        }
        setErrorMessage(detail);
        return;
      }

      const data = JSON.parse(text);

      setSuccessOpen(true);
      setRegisteredName(data.name);

      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (e) {
      console.error(e);
      setErrorMessage("Nettverksfeil – kunne ikke nå serveren.");
    }
  };

  useEffect(() => {
    async function loadCommittees() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/equipment/committees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setCommitteeNames(
          Array.isArray(data)
            ? data.map((name: string) => name.charAt(0).toUpperCase() + name.slice(1))
            : []
        );
      } catch (err) {
        console.error("Error loading committees:", err);
      }
    }
    loadCommittees();
  }, []);

  return (
    <>
      <NavBar></NavBar>
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {registeredName} ble registrert!
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={5000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      <Box className="flex justify-center items-start sm:items-center min-h-screen px-4 pt-20 sm:pt-0 bg-blue">
        <Paper
          elevation={4}
          className="relative p-8 rounded-2xl w-full max-w-md flex flex-col gap-5"
        >
          <IconButton
            onClick={handleGoBackToHomePage}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          {/* Tittel */}
          <Typography variant="h5" className="font-semibold text-center">
            Registrer utstyr
          </Typography>

          {/* Komité */}
          <FormControl fullWidth>
            <InputLabel>Komité</InputLabel>
            <Select
              value={committee}
              onChange={handleChangeCommittee}
              label="Komité"
            >
              {committeeNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Navn på utstyr"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <TextField
            label="Type utstyr"
            value={type}
            onChange={(e) => setType(e.target.value)}
            fullWidth
          />

          {/* Beskrivelse */}
          <TextField
            label="Beskrivelse"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          <Typography>Angi lagringssted for utstyr</Typography>
          <AddressSearch setCoords={setCoords}></AddressSearch>

          {/* Knapp */}
          <Button
            disabled={!isFormValid}
            variant="contained"
            size="large"
            className="mt-2 rounded-xl"
            onClick={handleRegister}
          >
            Lagre utstyr
          </Button>
        </Paper>
      </Box>
    </>
  );
}
