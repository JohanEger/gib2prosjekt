import { useEffect, useState } from "react";
import React from "react";
import arrow from "../assets/arrow.svg";
import { Equipment } from "./Equipment";
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
  Checkbox,
  TextField,
  FormControlLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import TuneIcon from "@mui/icons-material/Tune";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import type { EquipmentFilters } from "../types/equipmentFilters";
import { useUserLocation } from "../hooks/useUserLocation";
import { useGeolocation } from "../hooks/useGeolocation";

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

const committeeNames = ["turingen", "arrkom", "bedkom", "ståpels"];
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

interface SidebarProps {
  filters: EquipmentFilters;
  setFilters: React.Dispatch<React.SetStateAction<EquipmentFilters>>;
}


export const Sidebar = ({filters, setFilters}: SidebarProps) => {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [open, setOpen] = useState(true);
  const [showFilter, setShowfilter] = useState(false);
  const { latitude, longitude } = useGeolocation();
  
  useEffect(() => {
    async function loadEquipment() {
      try {
        const params = new URLSearchParams();

        filters.committee.forEach((c) => params.append("committee", c));
        if (filters.distance > 0) params.append("euclidean_distance", filters.distance.toString());
        if (filters.typeOfEquipment) params.append("type_of_equipment", filters.typeOfEquipment);
        if (filters.available) params.append("available", "true");
        if (latitude !== null && longitude !== null) {
          params.append("latitude", latitude.toString());
          params.append("longitude", longitude.toString());
        }

        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE}/equipment/sidebar?${params.toString()}`,
          {
            headers: token? { Authorization: `Bearer ${token}` } : {},
          }
        );

        const data = await res.json();
        setEquipment(Array.isArray(data) ? data : []);
        console.log(data);
      } catch (err) {
        console.error("Error loading equipment:", err);
      } 
    }

    loadEquipment();
  }, [filters]);
  
    const handleChangeCommittee = (
      event: SelectChangeEvent<string[]>
    ) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        committee: typeof value === "string" ? value.split(",") : value,
      }));
    };

  const handleDistanceChange = (_event: Event, value: number | number[]) => {
    setFilters((prev) => ({
      ...prev,
      distance: Array.isArray(value) ? value[0] : value,
    }));
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      typeOfEquipment: event.target.value,
    }));
  };

  const handleAvailableChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters((prev) => ({
      ...prev,
      available: event.target.checked,
    }));
  };

  const resetFilters = () => {
    setFilters({
      committee: [],
      distance: 0,
      typeOfEquipment: "",
      available: false,
    });
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white
        transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Box className="flex justify-end relative top-20 right-0">
          <Button
            onClick={() => {
              setShowfilter(!showFilter);
            }}
          >
            <TuneIcon color="primary"></TuneIcon>
          </Button>
        </Box>
        <ul className="relative flex flex-col gap-4 p-4 mt-24 max-h-3/4 overflow-y-auto scrollable-ul">
          {equipment.map((item) => (
           <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </ul>
      </div>

      <button
        onClick={() => {
          setOpen(!open);
          setShowfilter(false);
        }}
        className={`fixed top-1/2  z-50 p-1
        transition-all duration-300 cursor-pointer
        ${open ? "left-62" : "left-0"}`}
      >
        <img
          src={arrow}
          alt="Toggle"
          className={`w-7 h-7 transition-transform duration-300
          ${open ? "rotate-90" : "rotate-270"}`}
        />
      </button>
      {showFilter && (
        <Box
          className=" fixed z-30 top-20 left-70 flex bg-white shadow-lg w-[16rem] p-4 flex flex-col gap-4"
          sx={{ borderRadius: "0.5rem" }}
        >
          <Typography variant="h6">Filtre</Typography>

          <Box className="flex flex-col">
            <FormControl sx={{ m: 1, width: 200 }}>
              <InputLabel id="demo-multiple-checkbox-label">Komité</InputLabel>
              <Select
                labelId="demo-multiple-checkbox-label"
                id="demo-multiple-checkbox"
                multiple
                value={filters.committee}
                input={<OutlinedInput label="Komité" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
                onChange={handleChangeCommittee}
              >
                {committeeNames.map((name) => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={filters.committee.includes(name)} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </Box>

          <Box className="flex flex-col">
            <Typography>Avstand (m)</Typography>
            <Slider 
            value={filters.distance}
            min = {0}
            max = {5000} 
            aria-label="Default" 
            onChange={handleDistanceChange}
            valueLabelDisplay="auto" 
            />
            </Box>

          <TextField
            label="Type utstyr"
            value={filters.typeOfEquipment}
            onChange={handleTypeChange}
            size="small"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={filters.available}
                onChange={handleAvailableChange}
              />
            }
            label="Kun tilgjengelig"
          />

          <Button variant="outlined" onClick={resetFilters}>
            Nullstill filtre
          </Button>
        </Box>
      )}
    </>
  );
};
