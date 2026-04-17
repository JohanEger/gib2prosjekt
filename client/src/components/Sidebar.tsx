import { useEffect, useState } from "react";
import arrow from "../assets/arrow.svg";
import CloseIcon from "@mui/icons-material/Close";
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
  Checkbox,
  TextField,
  FormControlLabel,
  IconButton,
  Avatar,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import TuneIcon from "@mui/icons-material/Tune";
import type { EquipmentFilters } from "../types/equipmentFilters";
import type { RouteTravelMode } from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import type { Equipment } from "../types/equipment";
import { useGeolocation } from "../hooks/useGeolocation";
import { API_BASE } from "../apiBase";
import type { LogPosition } from "./LogMapLayer";

const committeeNames = ["Turingen", "Arrkom", "Bedkom", "Ståpels"];

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

type Coordinates = {
  lat: number;
  lng: number;
};

interface SidebarProps {
  filters: EquipmentFilters;
  setFilters: React.Dispatch<React.SetStateAction<EquipmentFilters>>;
  findEquipment: Coordinates | null;
  SetFindEquipment: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  travelMode: RouteTravelMode;
  setTravelMode: React.Dispatch<React.SetStateAction<RouteTravelMode>>;
  routePanel: RoutePanelState;
  setSelectedEquipmentId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedEquipmentId: string | null;
  clearSelection: () => void;

  setShowLogMode: React.Dispatch<React.SetStateAction<boolean>>;
  onShowLog: (equipmentId: string) => Promise<void>;
  setLogPositions: React.Dispatch<React.SetStateAction<LogPosition[]>>;
  activeEquipment: Equipment | null;
  setActiveEquipment: React.Dispatch<React.SetStateAction<Equipment | null>>;
  selectedClusterEquipmentIds: string[] | null;
  setSelectedClusterEquipmentIds: React.Dispatch<
    React.SetStateAction<string[] | null>
  >;
}

export const Sidebar = ({
  filters,
  setFilters,
  findEquipment,
  SetFindEquipment,
  travelMode,
  setTravelMode,
  routePanel,
  setSelectedEquipmentId,
  selectedEquipmentId,
  setShowLogMode,
  onShowLog,
  setLogPositions,
  clearSelection,
  activeEquipment,
  setActiveEquipment,
  selectedClusterEquipmentIds,
  setSelectedClusterEquipmentIds,
}: SidebarProps) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [open, setOpen] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const equipmentTypes = Array.from(
    new Set(equipment.map((eq) => eq.type_of_equipment)),
  );

  const { latitude, longitude } = useGeolocation();

  useEffect(() => {
    async function loadEquipment() {
      try {
        const params = new URLSearchParams();

        filters.committee.forEach((c) =>
          params.append("committee", c.toLowerCase()),
        );

        if (filters.distance > 0) {
          params.append("euclidean_distance", filters.distance.toString());
        }

        if (filters.typeOfEquipment) {
          params.append("type_of_equipment", filters.typeOfEquipment);
        }

        if (filters.available) {
          params.append("available", "true");
        }

        if (latitude !== null && longitude !== null) {
          params.append("latitude", latitude.toString());
          params.append("longitude", longitude.toString());
        }

        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE}/equipment/sidebar?${params.toString()}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        const data = await res.json();
        setEquipment(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading equipment:", err);
      }
    }

    loadEquipment();
  }, [filters, latitude, longitude]);

  const getEquipment = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/equipment/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      setActiveEquipment(data);
    } catch (err) {
      console.error("Error fetching equipment:", err);
    }
  };

  const handleCloseEquipment = () => {
    setActiveEquipment(null);
    SetFindEquipment(null);
  };

  const handleCloseFilterCard = () => setShowFilter(false);

  const handleChangeCommittee = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      committee: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleDistanceChange = (_: Event, value: number | number[]) => {
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
    event: React.ChangeEvent<HTMLInputElement>,
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
    setSelectedClusterEquipmentIds(null);
  };



  const getMarkerStyle = (size: number, color: string, bordercolor: string) => ({
    margin: 0.1,
    width: size,
    height: size,
    borderRadius: "50%",
    background: color,
    border: `2px solid ${bordercolor}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.5,
  });

  type LegendItemProps = {
    color: string;
    size?: number;
    label?: string;
    text: string;
    bordercolor: string;
  };

  const LegendItem = ({ color, size = 18, label, text, bordercolor }: LegendItemProps) => (
    <div className="flex items-center gap-2">
      <div style={getMarkerStyle(size, color, bordercolor)}>
        {label}
      </div>
      <span className="text-xs">{text}</span>
    </div>
  );

  const [showLegend, setShowLegend] = useState(true);
  const visibleEquipment =
    selectedClusterEquipmentIds === null
      ? equipment
      : equipment.filter((eq) => selectedClusterEquipmentIds.includes(eq.id));

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white
        transform transition-transform duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Box className="flex justify-end relative top-20 right-2">
          <Button onClick={() => setShowFilter(!showFilter)}>
            <TuneIcon className="text-blue-500 hover:scale-105 transition-transform" />
          </Button>
        </Box>

        <ul className="relative flex flex-col gap-3 p-4 mt-24 max-h-3/4 overflow-y-auto overflow-x-hidden">
          {visibleEquipment.map((item) => (
            <Box
              sx={{ borderRadius: 4 }}
              key={item.id}
              onClick={() => {
                if (selectedEquipmentId === item.id) {
                  setSelectedEquipmentId(null);
                  setActiveEquipment(null);
                  SetFindEquipment(null);
                  setLogPositions([]);
                } else {
                  setSelectedEquipmentId(item.id);
                  getEquipment(item.id);
                  setLogPositions([]);
                }
              }}
              className={`text-black cursor-pointer transition-all duration-200 rounded p-2 
                ${selectedEquipmentId === item.id
                  ? "bg-green-800 text-white ring-2 ring-blue-100"
                  : "bg-white text-black hover:scale-105 hover:shadow-lg"
                }`}
            >
              {item.name}
            </Box>
          ))}
        </ul>

        {/* Tegnbeskrivelse */}
        <button
          onClick={() => setShowLegend(prev => !prev)}
          className="ml-3 mt-1 text-xs text-blue-500 underline"
        >
          {showLegend ? "Skjul tegnforklaring" : "Vis tegnforklaring"}
        </button>

        {showLegend && (
          <div className="mt-0.5 ml-3 flex flex-col gap-0.5 ">
            <LegendItem
              color="#4285f4"
              size={15}
              text=" Din posisjon"
              bordercolor="white"
            />
            <div className="mt-1 flex flex-row gap-4">
              <LegendItem
                color="#15803d"
                text="Valgt utstyr"
                bordercolor="black"
              />
              <LegendItem
                color="#2563eb"
                text="Annet utstyr"
                bordercolor="black"
              />
            </div>
            <LegendItem
              color="#2563eb"
              size={26}
              label="7"
              text="Antall utstyr med delt lokasjon"
              bordercolor="black"
            />
          </div>)}

      </div>

      {/* Toggle button */}
      <button
        onClick={() => {
          setOpen(!open);
          setShowFilter(false);
        }}
        className={`fixed top-1/2 z-50 p-1 transition-all duration-300 cursor-pointer
        ${open ? "left-64" : "left-0"}`}
      >
        <img
          src={arrow}
          alt="Toggle"
          className={`w-7 h-7 transition-transform duration-300
          ${open ? "rotate-90" : "rotate-270"}`}
        />
      </button>

      {/* Equipment popup */}
      <div
        className={`fixed top-24 right-4 w-[90%] sm:w-[30rem]
                    max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl duration-300 z-40 
        ${activeEquipment ? "translate-x-0 opacity-100 " : "translate-x-full opacity-0 pointer-events-none"}`}
      >
        {activeEquipment && (
          <EquipmentPopUp
            id={activeEquipment.id}
            name={activeEquipment.name}
            lat={activeEquipment.lat}
            lng={activeEquipment.lng}
            description={activeEquipment.description}
            functional_status={activeEquipment.functional_status}
            functional_status_comment={activeEquipment.functional_status_comment}
            func={() => console.log("Book equipment")}
            booked={activeEquipment.booked}
            findEquipment={findEquipment}
            SetFindEquipment={SetFindEquipment}
            onClose={handleCloseEquipment}
            travelMode={travelMode}
            setTravelMode={setTravelMode}
            routePanel={routePanel}
            isRouteTarget={
              findEquipment !== null &&
              findEquipment.lat === activeEquipment.lat &&
              findEquipment.lng === activeEquipment.lng
            }
            setShowLogMode={setShowLogMode}
            onShowLog={onShowLog}
            setLogPositions={setLogPositions}
            clearSelection={clearSelection}
          />
        )}
      </div>

      {/* Filters */}
      {showFilter && (
        <Box
          className="fixed z-30 top-20 left-72 flex bg-white shadow-lg w-[16rem] p-4 flex flex-col gap-4"
          sx={{ borderRadius: "0.5rem" }}
        >
          <Box className="flex items-center justify-between mb-1 ml-1">
            <Typography variant="h6">Filtre</Typography>
            <IconButton onClick={handleCloseFilterCard} className="absolute">
              <CloseIcon />
            </IconButton>
          </Box>

          <FormControl sx={{ width: 200 }}>
            <InputLabel>Komité</InputLabel>
            <Select
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

          <Box>
            <Typography>Avstand (m)</Typography>
            <Slider
              value={filters.distance}
              min={0}
              max={5000}
              onChange={handleDistanceChange}
              valueLabelDisplay="auto"
            />
          </Box>

          <FormControl sx={{ width: 200 }}>
            <InputLabel>Type utstyr</InputLabel>
            <Select
              value={filters.typeOfEquipment}
              input={<OutlinedInput label="Type utstyr" />}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  typeOfEquipment: e.target.value,
                }))
              }
            >
              <MenuItem value="">
                <em>Alle</em>
              </MenuItem>

              {equipmentTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
