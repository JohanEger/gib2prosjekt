import { Box } from "@mui/material";
import { useState } from "react";

type MapControlProps = {
  setMap: React.Dispatch<React.SetStateAction<string>>;
};

const maptypes = [
  {
    id: "alidade_smooth",
    label: "Kart",
    image: "/maptypes/alidade.png",
  },
  {
    id: "satellite",
    label: "Ortofoto",
    image: "/maptypes/satellite.png",
  },
  {
    id: "stamen_terrain",
    label: "Terreng",
    image: "/maptypes/terrain.png",
  },
];

const MapControl = ({ setMap }: MapControlProps) => {
  const [activeMap, setActiveMap] = useState<string>("alidade_smooth");
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
      }}
    >
      {maptypes.map((m) => (
        <button
          key={m.id}
          className="px-1 cursor-pointer"
          onClick={() => {
            setMap(m.id);
            setActiveMap(m.id);
          }}
        >
          <div
            className={`w-16 h-12 overflow-hidden rounded-lg border-2 ${
              activeMap === m.id ? "border-blue-500" : "border-gray-200"
            }`}
          >
            <img
              src={m.image}
              className="w-full h-full object-cover object-center scale-250"
            />
          </div>
        </button>
      ))}
    </Box>
  );
};

export default MapControl;
