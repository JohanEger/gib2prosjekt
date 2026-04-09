import { Description } from "@headlessui/react";
import { Typography, Box, IconButton } from "@mui/material";
import Paper from "@mui/material/Paper";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";

type Coordinates = {
  lat: number;
  lng: number;
};

type Props = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  func: () => void;
  booked: boolean;
  SetFindEquipment: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  onClose: () => void;
};

export const EquipmentPopUp = ({
  name,
  lat,
  lng,
  description,
  id,
  func,
  booked,
  SetFindEquipment,
  onClose,
}: Props) => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAddress() {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          {
            headers: {
              "User-Agent": "equipment-map-app",
            },
          },
        );

        const data = await res.json();

        const addr = data.address;

        setAddress(
          `${addr.road ?? ""} ${addr.house_number ?? ""}, ${addr.suburb ?? addr.city ?? ""}`,
        );
      } catch (err) {
        setAddress("Kunne ikke hente adresse");
      } finally {
        setLoading(false);
      }
    }

    loadAddress();
  }, [lat, lng]);


  return (
    <Paper
      elevation={3}
      className="w-full h-full pl-2 pr-2 pb-16 bg-black text-white flex flex-col items-center pt-2 gap-4 relative"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton onClick={onClose} className="absolute top-2 left-50">
        <CloseIcon />
      </IconButton>

      <Typography variant="h4">{name}</Typography>

      <Paper className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20">
        {booked ? (
          <>
            <CancelIcon className="text-red-500" fontSize="small" />
            <Typography className="text-red-500 font-semibold">
              Booket
            </Typography>
          </>
        ) : (
          <>
            <CheckCircleIcon className="text-green-500" fontSize="small" />
            <Typography className="text-green-500 font-semibold">
              Ledig
            </Typography>
          </>
        )}
      </Paper>

      <Typography className="text-center px-6">
        {loading ? (
          "Laster adresse..."
        ) : (
          <>
            <LocationPinIcon fontSize="small" className="mr-1" />
            {address}
          </>
        )}
      </Typography>
      <Typography>{description}</Typography>

      <Link
        to={`/calendar/${id}/${name}`}
        className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 
  hover:from-blue-600 hover:to-indigo-700
  text-white font-semibold rounded-xl shadow-lg
  transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        Book utstyr
      </Link>
      <Button
        onClick={() => SetFindEquipment({ lat, lng })}
        className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 
  hover:from-blue-600 hover:to-indigo-700
  text-white font-semibold rounded-xl shadow-lg
  transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
      >
        Finn vei
      </Button>
    </Paper>
  );
};
