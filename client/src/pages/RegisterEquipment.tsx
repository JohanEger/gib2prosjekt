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
import { useState } from "react";
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
  const committeeNames = ["Turingen", "Arrkom", "Bedkom", "Ståpels"];

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [committee, setCommittee] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [registeredName, setRegisteredName] = useState<String>("");
  const [successOpen, setSuccessOpen] = useState(false);

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
        throw new Error("Kunne ikke lagre");
      }

      const data = JSON.parse(text);

      setSuccessOpen(true);
      setRegisteredName(data.name);

      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (e) {
      console.error(e);
    }
  };

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
          {registeredName} ble registrert 🎉
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
