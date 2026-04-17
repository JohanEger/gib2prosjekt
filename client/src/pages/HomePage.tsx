import { Map } from "../components/Map";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import type { RouteTravelMode } from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import { useState, type SetStateAction } from "react";
import type { EquipmentFilters } from "../types/equipmentFilters";
import type { LogPosition } from "../types/logPositions";
import { LogMapLayer } from "@/components/LogMapLayer";

export const HomePage = () => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(
    null,
  );
  const [activeEquipment, setActiveEquipment] = useState(null);
  const [filters, setFilters] = useState<EquipmentFilters>({
    committee: [],
    distance: 0,
    typeOfEquipment: "",
    available: false,
  });

  const [findEquipment, setFindEquipment] = useState<Coordinates | null>(null);
  const [travelMode, setTravelMode] = useState<RouteTravelMode>("walk");
  const [routePanel, setRoutePanel] = useState<RoutePanelState>({
    status: "idle",
  });

  const [logPositions, setLogPositions] = useState<LogPosition[]>([]);
  const [showLogMode, setShowLogMode] = useState(false);

  const clearSelection = () => {
    setSelectedEquipmentId(null);
    setFindEquipment(null);
  };


  type Coordinates = {
    lat: number;
    lng: number;
  };

  const API_BASE = "http://localhost:5001";

  const handleShowLog = async (equipmentId: string) => {
    console.log("HENTER LOGG FOR:", equipmentId);

    setShowLogMode(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/booking/log/${equipmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      console.log("LOGG FRA API:", data);

      setLogPositions(data);
    } catch (err) {
      console.error("Feil ved henting av logg:", err);
    }
  };


  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <NavBar />
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        findEquipment={findEquipment}
        SetFindEquipment={setFindEquipment}
        travelMode={travelMode}
        setTravelMode={setTravelMode}
        routePanel={routePanel}
        setSelectedEquipmentId={setSelectedEquipmentId}
        selectedEquipmentId={selectedEquipmentId}
        clearSelection={clearSelection}
        setShowLogMode={setShowLogMode}
        onShowLog={handleShowLog}
        setLogPositions={setLogPositions}
      />

      <Map
        filters={filters}
        coordinates={findEquipment}
        travelMode={travelMode}
        onRoutePanelChange={setRoutePanel}
        selectedEquipmentId={selectedEquipmentId}
        logPositions={logPositions}
        LogPositions={logPositions}
        showLogMode={showLogMode}
        setShowLogMode={setShowLogMode}
      />
    </div>
  );
};
