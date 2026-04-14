import { Map } from "../components/Map";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import type { RouteTravelMode } from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import { useState, type SetStateAction } from "react";
import type { EquipmentFilters } from "../types/equipmentFilters";



export const HomePage = () => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [activeEquipment, setActiveEquipment] = useState(null);
  const [filters, setFilters] = useState<EquipmentFilters>({
    committee: [],
    distance: 0,
    typeOfEquipment: "",
    available: false,
  });

  const clearSelection = () => {
    setSelectedEquipmentId(null);
    setFindEquipment(null);
  };


  type Coordinates = {
    lat: number;
    lng: number;
  };

  const [findEquipment, setFindEquipment] = useState<Coordinates | null>(null);
  const [travelMode, setTravelMode] = useState<RouteTravelMode>("walk");
  const [routePanel, setRoutePanel] = useState<RoutePanelState>({
    status: "idle",
  });

  
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
         />
      <Map
        filters={filters}
        coordinates={findEquipment}
        travelMode={travelMode}
        onRoutePanelChange={setRoutePanel}
        selectedEquipmentId={selectedEquipmentId}
      />
    </div>
  );
};
