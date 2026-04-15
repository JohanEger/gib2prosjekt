import { Map } from "../components/Map";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import type { RouteTravelMode } from "../types/routeTravelMode";
import type { RoutePanelState } from "../types/routePanelState";
import { useState } from "react";
import type { EquipmentFilters } from "../types/equipmentFilters";

export const HomePage = () => {
  const [filters, setFilters] = useState<EquipmentFilters>({
    committee: [],
    distance: 0,
    typeOfEquipment: "",
    available: false,
  });

  type Coordinates = {
    lat: number;
    lng: number;
  };

  type Equipment = {
    id: string;
    name: string;
    description: string;
    type_of_equipment: string;
    owner_id: string;
    lat: number;
    lng: number;
    booked: boolean;
  };

  const [findEquipment, setFindEquipment] = useState<Coordinates | null>(null);
  const [activeEquipment, setActiveEquipment] = useState<Equipment | null>(null);
  const [travelMode, setTravelMode] = useState<RouteTravelMode>("walk");
  const [routePanel, setRoutePanel] = useState<RoutePanelState>({
    status: "idle",
  });
  const [selectedClusterEquipmentIds, setSelectedClusterEquipmentIds] = useState<string[] | null>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <NavBar />
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        SetFindEquipment={setFindEquipment}
        findEquipment={findEquipment}
        travelMode={travelMode}
        setTravelMode={setTravelMode}
        routePanel={routePanel}
        activeEquipment={activeEquipment}
        setActiveEquipment={setActiveEquipment}
        selectedClusterEquipmentIds={selectedClusterEquipmentIds}
        setSelectedClusterEquipmentIds={setSelectedClusterEquipmentIds}
      />
      <Map
        filters={filters}
        coordinates={findEquipment}
        travelMode={travelMode}
        onRoutePanelChange={setRoutePanel}
        activeEquipment={activeEquipment}
        setActiveEquipment={setActiveEquipment}
        setSelectedClusterEquipmentIds={setSelectedClusterEquipmentIds}
      />
    </div>
  );
};
