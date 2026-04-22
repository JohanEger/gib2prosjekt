import { Map } from "../components/Map";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import { LocationStatusBanner } from "../components/LocationStatusBanner";
import type { RouteTravelMode } from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import { useState, type SetStateAction } from "react";
import type { EquipmentFilters } from "../types/equipmentFilters";
import type { LogPosition } from "../types/logPositions";
import type { Equipment } from "../types/equipment";
import { API_BASE } from "../apiBase";

export const HomePage = () => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(
    null,
  );
  //const [activeEquipment, setActiveEquipment] = useState(null);
  const [filters, setFilters] = useState<EquipmentFilters>({
    committee: [],
    distance: 0,
    typeOfEquipment: "",
    available: false,
  });

  const [findEquipment, setFindEquipment] = useState<Coordinates | null>(null);
  const [activeEquipment, setActiveEquipment] = useState<Equipment | null>(null);
  const [travelMode, setTravelMode] = useState<RouteTravelMode>("walk");
  const [routePanel, setRoutePanel] = useState<RoutePanelState>({
    status: "idle",
  });
  const [selectedClusterEquipmentIds, setSelectedClusterEquipmentIds] = useState<string[] | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [fiveLatestID, setFiveLatestID] = useState<string | null>(null);
  const [logPositions, setLogPositions] = useState<LogPosition[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogMode, setShowLogMode] = useState(false);
  const currentPosition = activeEquipment
  ? { lat: activeEquipment.lat, lng: activeEquipment.lng }
  : null;

  const clearSelection = () => {
    setSelectedEquipmentId(null);
    setFindEquipment(null);
  };


  type Coordinates = {
    lat: number;
    lng: number;
  };

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
      <LocationStatusBanner />
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
        activeEquipment={activeEquipment}
        setActiveEquipment={setActiveEquipment}
        selectedClusterEquipmentIds={selectedClusterEquipmentIds}
        setLogError={setLogError}
        setFiveLatestID={setFiveLatestID}
        setSelectedClusterEquipmentIds={setSelectedClusterEquipmentIds}
        open = {sidebarOpen}
        setOpen = {setSidebarOpen}
      />

      <Map
        filters={filters}
        coordinates={findEquipment}
        travelMode={travelMode}
        onRoutePanelChange={setRoutePanel}
        selectedEquipmentId={selectedEquipmentId}
        setSelectedEquipmentId={setSelectedEquipmentId}
        logPositions={logPositions}
        currentPosition={currentPosition}
        LogPositions={logPositions}
        showLogMode={showLogMode}
        setShowLogMode={setShowLogMode}
        activeEquipment={activeEquipment}
        setActiveEquipment={setActiveEquipment}
        setSelectedClusterEquipmentIds={setSelectedClusterEquipmentIds}
        setSidebarOpen={setSidebarOpen}
      />
    </div>
  );
};
