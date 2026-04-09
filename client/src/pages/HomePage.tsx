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
        SetFindEquipment={setFindEquipment}
        findEquipment={findEquipment}
        travelMode={travelMode}
        setTravelMode={setTravelMode}
        routePanel={routePanel}
      />
      <Map
        filters={filters}
        coordinates={findEquipment}
        travelMode={travelMode}
        onRoutePanelChange={setRoutePanel}
      />
    </div>
  );
};
