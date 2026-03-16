import { use, useEffect, useState } from "react";
import arrow from "../assets/arrow.svg";
import { EquipmentPopUp } from "./EquipmentPopUp";
import {
  Box,
  Button,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  ListItemText,
  Select,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import TuneIcon from "@mui/icons-material/Tune";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import type { LatLng } from "leaflet";

type Equipment = {
  id: string;
  name: string;
  description: string;
  type_of_equipment: string;
  owner_id: string;
  current_pos: {
    lat: number;
    lng: number;
  };
};
const committeeNames = ["turingen", "arrkom", "bedkom", "ståpels"];

export const Sidebar = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [open, setOpen] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [committee, setCommittee] = useState<string[]>([]);
  const [activeEquipment, setActiveEquipment] = useState<Equipment | null>(
    null,
  );
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    async function loadEquipment() {
      try {
        const params = new URLSearchParams();
        committee.forEach((c) => params.append("committee", c));

        const res = await fetch(
          `http://localhost:5001/equipment/sidebar?${params.toString()}`,
        );

        const data = await res.json();
        console.log(data);
        setEquipment(Array.isArray(data) ? data : []);
        console.log(data);
      } catch (err) {
        console.error("Error loading equipment:", err);
      }
    }

    loadEquipment();
  }, [committee]);

  useEffect(() => {
    async function checkBooking(id: string) {
      const res = await fetch(
        `http://localhost:5001/equipment/checkbooking?id=${id}`,
      );

      const data = await res.json();
      setAvailable(data);
      console.log(data);
    }

    if (activeEquipment?.id) {
      checkBooking(activeEquipment.id);
    }
  }, [activeEquipment?.id]);

  async function getEquipment(id: string) {
    try {
      const res = await fetch(`http://localhost:5001/equipment/popup?id=${id}`);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setActiveEquipment(data);
      console.log(data);
    } catch (err) {
      console.error("Error loading equipment:", err);
    }
  }

  const handleChange = (event: SelectChangeEvent<typeof committeeNames>) => {
    const {
      target: { value },
    } = event;

    setCommittee(typeof value === "string" ? value.split(",") : value);
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white
        transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Box className="flex justify-end relative top-20 right-0">
          <Button onClick={() => setShowFilter(!showFilter)}>
            <TuneIcon color="primary" />
          </Button>
        </Box>

        <ul className="relative flex flex-col gap-2 p-4 mt-24 max-h-3/4 overflow-y-auto">
          {equipment.map((item) => (
            <MenuItem key={item.id}>
              <Box
                className="bg-white shadow-lg rounded-xl transition-all duration-200 hover:scale-105 cursor-pointer"
                onClick={() => getEquipment(item.id)}
              >
                <Typography className="text-black p-2">{item.name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </ul>
      </div>

      <button
        onClick={() => {
          setOpen(!open);
          setShowFilter(false);
        }}
        className={`fixed top-1/2 z-50 p-1 transition-all duration-300 cursor-pointer ${
          open ? "left-64" : "left-0"
        }`}
      >
        <img
          src={arrow}
          alt="Toggle"
          className={`w-7 h-7 transition-transform duration-300 ${
            open ? "rotate-90" : "rotate-270"
          }`}
        />
      </button>

      <div
        className={`fixed top-0 right-0 w-[30rem] h-screen bg-white shadow-xl
        transform transition-transform duration-300 z-40
        ${activeEquipment ? "translate-x-0" : "translate-x-full"}`}
      >
        {activeEquipment && (
          <EquipmentPopUp
            name={activeEquipment.name}
            latlng={activeEquipment.current_pos}
            description={activeEquipment.description}
            func={() => console.log("Booker")}
            booked={available}
          />
        )}
      </div>

      {showFilter && (
        <Box
          className="fixed z-30 top-20 left-72 flex bg-white shadow-lg w-[16rem] p-4 flex flex-col gap-4"
          sx={{ borderRadius: "0.5rem" }}
        >
          <Typography variant="h6">Filtre</Typography>
          <FormControl sx={{ width: 200 }}>
            <InputLabel>Komité</InputLabel>

            <Select
              multiple
              value={committee}
              input={<OutlinedInput label="Komité" />}
              renderValue={(selected) => selected.join(", ")}
              onChange={handleChange}
            >
              {committeeNames.map((name) => {
                const selected = committee.includes(name);

                const SelectionIcon = selected
                  ? CheckBoxIcon
                  : CheckBoxOutlineBlankIcon;

                return (
                  <MenuItem key={name} value={name}>
                    <SelectionIcon
                      fontSize="small"
                      style={{ marginRight: 8 }}
                    />
                    <ListItemText primary={name} />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Box className="flex flex-col">
            <Typography>Avstand</Typography>
            <Slider defaultValue={0} />
          </Box>
        </Box>
      )}
    </>
  );
};
