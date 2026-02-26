import { Map } from "../components/Map";
import { NavBar } from "../components/NavBar";
import { Sidebar } from "../components/Sidebar";

export const HomePage = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <NavBar />
      <Sidebar />
      <Map />
    </div>
  );
};