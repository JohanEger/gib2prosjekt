import React, { useEffect, useState } from "react";
import { Paper, Typography, Button, Box } from "@mui/material";
import { NavBar } from "../components/NavBar";
import type { DateValue } from "react-aria-components";
import { getLocalTimeZone, today as todayAria } from "@internationalized/date";
import { BookingRangeCalendar } from "@/components/calendar/BookingRangeCalendar";
import { BookedDatesCalendar } from "@/components/calendar/BookedDatesCalendar";
import BookingPopup from "@/components/BookingPopup";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

interface Booking {
  id: string;
  equipmentId: string;
  userId: string;
  start_time: Date;
  end_time: Date;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

function dateValueToDate(d: DateValue): Date {
  return new Date(d.year, d.month - 1, d.day);
}

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isDateBooked(date: DateValue, bookings: Booking[]): boolean {
  const current = toDateOnly(dateValueToDate(date));

  return bookings.some((b) => {
    const start = toDateOnly(b.start_time);
    const end = toDateOnly(b.end_time);
    return start <= current && end >= current;
  });
}

function getBookingForDate(date: DateValue, bookings: Booking[]) {
  const d = toDateOnly(dateValueToDate(date));
  return bookings.find((b) => {
    const start = toDateOnly(b.start_time);
    const end = toDateOnly(b.end_time);
    return start <= d && end >= d;
  });
}

export const CalendarPage = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  const { token } = useAuth();

  const today = todayAria(getLocalTimeZone());

  const [mode, setMode] = useState<"book" | "view">("book");
  const [selectedRange, setSelectedRange] = useState<{
    start?: DateValue;
    end?: DateValue;
  }>({});
  const [focusedDate, setFocusedDate] = useState<DateValue>(today);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBookings = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/booking/booking_for_equipment/${id}`,
        );

        const data = await res.json();

        const parsed = data.map((b: any) => ({
          id: b.id,
          equipmentId: b.equipment_id,
          userId: b.user_id,
          start_time: new Date(b.start_time + "Z"),
          end_time: new Date(b.end_time + "Z"),
          latitude: b.latitude,
          longitude: b.longitude,
          createdAt: new Date(b.created_at),
        }));

        console.log("BOOKINGS:", parsed);
        setBookings(parsed);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBookings();
  }, [id]);

  const handleRangeChange = (range: { start?: DateValue; end?: DateValue }) => {
    setSelectedRange(range);
  };

  const handleDateClick = async (date: DateValue) => {
    try {
      const iso = `${focusedDate.year}-${focusedDate.month.toString().padStart(2, "0")}-${focusedDate.day.toString().padStart(2, "0")}T00:00:00`;

      console.log("FETCHING booking for:", iso);

      const res = await fetch(
        `${API_BASE}/booking/get_booking_for_date?equipment_id=${id}&start_time=${iso}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR:", text);
        setSelectedBooking(null);
        return;
      }

      const data = await res.json();
      console.log("BOOKING FROM API:", data);

      if (!data) {
        setSelectedBooking(null);
        return;
      }

      const parsedBooking = {
        id: data.id,
        equipmentId: data.equipment_id,
        userId: data.user_id,
        start_time: new Date(data.start_time),
        end_time: new Date(data.end_time),
        latitude: data.latitude,
        longitude: data.longitude,
        createdAt: new Date(data.created_at),
      };

      setSelectedBooking(parsedBooking);
    } catch (err) {
      console.error("FETCH FAILED:", err);
      setSelectedBooking(null);
    }
  };

  return (
    <>
      <NavBar />

      <Box sx={{ mt: "8em", display: "flex", justifyContent: "center" }}>
        <Paper sx={{ maxWidth: 1000, p: 4 }}>
          <Typography variant="h5">{name}</Typography>

          <Box sx={{ display: "flex", gap: 4 }}>
            {/* LEFT PANEL */}
            <Box sx={{ flex: 1 }}>
              {mode === "view" && (
                <Paper sx={{ p: 2 }}>
                  {selectedBooking ? (
                    <>
                      <Typography variant="h6">Booking info</Typography>
                      <Typography>
                        Start: {selectedBooking.start_time.toDateString()}
                      </Typography>
                      <Typography>
                        End: {selectedBooking.end_time.toDateString()}
                      </Typography>
                    </>
                  ) : (
                    <Typography>Ingen booking valgt</Typography>
                  )}
                </Paper>
              )}
            </Box>

            {/* RIGHT PANEL */}
            <Box sx={{ flex: 1 }}>
              {/* MODE SWITCH */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  borderBottom: "1px solid #ddd",
                  mb: 2,
                }}
              >
                <Typography
                  onClick={() => setMode("book")}
                  sx={{
                    cursor: "pointer",
                    fontWeight: mode === "book" ? "bold" : "normal",
                  }}
                >
                  Book
                </Typography>

                <Typography
                  onClick={() => setMode("view")}
                  sx={{
                    cursor: "pointer",
                    fontWeight: mode === "view" ? "bold" : "normal",
                  }}
                >
                  View
                </Typography>
              </Box>

              {/* BOOK MODE */}
              {mode === "book" && (
                <>
                  <BookingRangeCalendar
                    focusedValue={focusedDate}
                    isDateBooked={(date) => isDateBooked(date, bookings)}
                    onChange={handleRangeChange}
                    onFocusChange={(date) => {
                      if (date) setFocusedDate(date);
                    }}
                  />

                  {selectedRange.start && selectedRange.end && (
                    <Button sx={{ mt: 2 }} onClick={() => setPopupOpen(true)}>
                      Book
                    </Button>
                  )}
                </>
              )}

              {/* VIEW MODE */}
              {mode === "view" && (
                <BookedDatesCalendar
                  focusedValue={focusedDate}
                  isDateBooked={(date) => isDateBooked(date, bookings)}
                  onBookedDateClick={(date) => handleDateClick(date)}
                />
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* POPUP */}
      {selectedRange.start && selectedRange.end && (
        <BookingPopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          startDate={selectedRange.start}
          endDate={selectedRange.end}
          equipmentId={id}
        />
      )}
    </>
  );
};
