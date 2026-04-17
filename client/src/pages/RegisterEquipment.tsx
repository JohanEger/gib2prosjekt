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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";

import AddressSearch from "@/components/calendar/AddressSearchBox";
import { API_BASE } from "@/apiBase";
import { useNavigate } from "react-router-dom";
type Coordinates = {
  lat: number;
  lng: number;
};

export default function RegisterEquipment() {
  const committeeNames = ["turingen", "arrkom", "bedkom", "ståpels"];

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

  const isFormValid =
    name.trim() !== "" &&
    type.trim() !== "" &&
    description.trim() !== "" &&
    committee !== "" &&
    coords !== null;

  const handleRegister = async () => {
    const register = {
      name,
      description,
      type,
      committee,
      latitude: coords?.lat,
      longitude: coords?.lng,
    };
    try {
      const res = await fetch(`${API_BASE}/equipment/register_equipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(register),
      });

      if (!res.ok) {
        throw new Error("Kunne ikke lagre");
      }

      const data = await res.json();
      console.log("Lagret:", data);
      setSuccessOpen(true);
      setRegisteredName(data.name);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (e) {
      console.log(e);
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
      <Box className="flex justify-center items-center min-h-screen bg-blue">
        <Paper
          elevation={4}
          className="p-8 rounded-2xl w-full max-w-md flex flex-col gap-5"
        >
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
