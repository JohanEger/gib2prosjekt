import { Description } from "@headlessui/react";
import { Typography, Box } from "@mui/material";
import Paper from "@mui/material/Paper";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

type Props = {
  name: string;
  lat: number;
  lng: number;
  description: string;
  func: () => void;
  booked: boolean;
};

async function getLocationName(lat: number, lng: number) {
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
    return data.display_name ?? "Adresse ikke funnet";
  } catch (err) {
    console.error("Geocoding error:", err);
    return "Kunne ikke hente adresse";
  }
}

export const EquipmentPopUp = ({
  name,
  lat,
  lng,
  description,
  func,
  booked,
}: Props) => {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  console.log(lat, lng);
  console.log(name);

  return (
    <Paper
      elevation={3}
      className="fixed top-0 right-0 w-[30rem] h-screen bg-black text-white flex flex-col items-center pt-24 gap-4"
    >
      <Typography variant="h4">{name}</Typography>

      <Paper className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20">
        {booked ? (
          <>
            <CheckCircleIcon className="text-green-500" fontSize="small" />
            <Typography className="text-green-500 font-semibold">
              Ledig
            </Typography>
          </>
        ) : (
          <>
            <CancelIcon className="text-red-500" fontSize="small" />
            <Typography className="text-red-500 font-semibold">
              Booket
            </Typography>
          </>
        )}
      </Paper>

      <Typography className="text-center px-6">
        {loading ? "Laster adresse..." : address}
      </Typography>
      <Typography>{description}</Typography>

      <Button
        onClick={func}
        className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 
  hover:from-blue-600 hover:to-indigo-700
  text-white font-semibold rounded-xl shadow-lg
  transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        Book utstyr
      </Button>
    </Paper>
  );
};
