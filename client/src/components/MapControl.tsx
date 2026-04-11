import { Box } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";

type MapControlProps = {
  setMap: React.Dispatch<React.SetStateAction<string>>;
};

const MapControl = ({ setMap }: MapControlProps) => {
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        padding: "12px",
        borderRadius: "12px",
      }}
    ></Box>
  );
};

export default MapControl;
