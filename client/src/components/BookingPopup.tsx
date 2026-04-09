import * as React from "react";
import { Box, Typography, Select, MenuItem, Button } from "@mui/material";
import type { DateValue } from "react-aria-components";
import { useEffect, useState } from "react";
import { fetchUserId } from "@/hooks/fetchUserId";
import { useAuth } from "@/hooks/useAuth";
import AddressSearch from "./calendar/AddressSearchBox";
import { useBookings } from "@/hooks/useBookings";

type BookingPopupProps = {
  open: boolean;
  onClose: () => void;
  startDate: DateValue;
  endDate: DateValue;
  equipmentId: string | undefined;
};

type Coordinates = {
  lat: number;
  lng: number;
};

const hours = [
  "hele dagen",
  ...Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")),
];

function formatDate(d: DateValue) {
  return `${d.day.toString().padStart(2, "0")}.${d.month.toString().padStart(2, "0")}.${d.year}`;
}

export default function BookingPopup({
  open,
  onClose,
  startDate,
  endDate,
  equipmentId,
}: BookingPopupProps) {
  const [startHour, setStartHour] = React.useState<string | "">("");
  const [endHour, setEndHour] = React.useState<string | "">("");
  const [booking, setBooking] = useState<String | null>(null);

  const [Coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const { createBooking } = useBookings();
  const handleBooking = async () => {
    if (!Coordinates || !equipmentId) return;

    const newBooking = {
      start: startDate.toDate("UTC"),
      end: endDate.toDate("UTC"),
      equipmentId: equipmentId,
      lat: Coordinates.lat,
      lng: Coordinates.lng,
    };
    console.log(newBooking);
    try {
      const booked = await createBooking(newBooking);
      setBooking(booked);
    } catch (err) {
      console.error(err);
    }
  };
  if (!open) return null;

  const startNumber =
    startHour === "hele dagen" ? -1 : startHour ? parseInt(startHour) : -1;
  const isSameDay =
    startDate.day === endDate.day &&
    startDate.month === endDate.month &&
    startDate.year === endDate.year;

  return (
    <>
      {booking ? (
        <Box
          onClick={onClose}
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: "white",
              padding: "32px",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              textAlign: "center",
              minWidth: "300px",
            }}
          >
            <h2 style={{ marginBottom: "12px" }}>Booking fullført!</h2>

            <p style={{ marginBottom: "20px" }}>
              Utstyret ble booket suksessfullt for {startDate.day}.
              {startDate.month}.{startDate.year} til {endDate.day}.
              {endDate.month}.{endDate.year}
            </p>
          </Box>
        </Box>
      ) : (
        <Box
          onClick={onClose}
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(1.5px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              p: 3,
              boxShadow: 3,
              minWidth: 320,
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6">Din booking:</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography>Dato start:</Typography>
              <Typography sx={{ fontWeight: "bold" }}>
                {formatDate(startDate)}
              </Typography>
              <Select
                size="small"
                value={startHour}
                onChange={(e) => {
                  setStartHour(e.target.value);
                  if (e.target.value === "hele dagen") setEndHour("hele dagen");
                  else if (endHour === "hele dagen") setEndHour("");
                }}
              >
                {hours.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography>Dato slutt:</Typography>
              <Typography sx={{ fontWeight: "bold" }}>
                {formatDate(endDate)}
              </Typography>
              <Select
                size="small"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                disabled={
                  !startHour || (isSameDay && startHour === "hele dagen")
                }
              >
                {hours.map((h) => {
                  const endNumber = h === "hele dagen" ? -1 : parseInt(h);
                  const disabled =
                    startHour !== "hele dagen" &&
                    startHour !== "" &&
                    startNumber >= 0 &&
                    endNumber >= 0 &&
                    endNumber <= startNumber;
                  return (
                    <MenuItem key={h} value={h} disabled={disabled}>
                      {h}
                    </MenuItem>
                  );
                })}
              </Select>
            </Box>
            <Box>
              <AddressSearch setCoords={setCoordinates}></AddressSearch>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                mt: 2,
              }}
            >
              <Button onClick={onClose} variant="outlined">
                Lukk
              </Button>
              <Button
                variant="contained"
                disabled={!startHour || !endHour}
                onClick={handleBooking}
              >
                Bekreft bokking
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
