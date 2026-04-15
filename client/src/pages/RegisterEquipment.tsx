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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { Nav } from "react-bootstrap";
import AddressSearch from "@/components/calendar/AddressSearchBox";

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

  const handleChangeCommittee = (event: SelectChangeEvent) => {
    setCommittee(event.target.value);
  };
  const isFormValid =
    name.trim() !== "" &&
    type.trim() !== "" &&
    description.trim() !== "" &&
    committee !== "" &&
    coords !== null;

  const handleRegister = () => {
    const register = {
      equipmentName: name,
      equipmentType: type,
      equipmentDescription: description,
      equipmentCommitte: committee,
      latitude: coords?.lat,
      longitude: coords?.lng,
    };
  };

  return (
    <>
      <NavBar></NavBar>
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

          {/* Navn */}
          <TextField
            label="Navn på utstyr"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          {/* Type */}
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
          >
            Lagre utstyr
          </Button>
        </Paper>
      </Box>
    </>
  );
}
