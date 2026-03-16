import { Map } from "../components/Map";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";
import {useState} from "react";
import type { EquipmentFilters } from "../types/equipmentFilters";

export const HomePage = () => {
  const [filters, setFilters] = useState<EquipmentFilters>({
    committee: [],
    distance: 0,
    typeOfEquipment: "",
    available: false,
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <NavBar />
      <Sidebar filters = {filters} setFilters={setFilters} />
      <Map filters={filters} />
    </div>
  );
};