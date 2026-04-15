import React, { useEffect, useState } from "react";
import { Paper, Typography, Button, Box, Divider } from "@mui/material";
import { NavBar } from "../components/NavBar";
import type { DateValue } from "react-aria-components";
import { getLocalTimeZone, today as todayAria } from "@internationalized/date";
import { BookingRangeCalendar } from "@/components/calendar/BookingRangeCalendar";
import { BookedDatesCalendar } from "@/components/calendar/BookedDatesCalendar";
import BookingPopup from "@/components/BookingPopup";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "@/apiBase";

interface Booking {
  id: string;
  equipmentId: string;
  userId: string;
  username: string;
  email: string;
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

  const fetchBookings = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/booking/booking_for_equipment/${id}`,
      );
      const data = await res.json();
      const parsedBookings = data.map((b: any) => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);

        return {
          id: b.id,
          equipmentId: b.equipment_id,
          userId: b.user_id,
          start_time: new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate(),
          ),
          end_time: new Date(end.getFullYear(), end.getMonth(), end.getDate()),
          latitude: b.latitude,
          longitude: b.longitude,
          createdAt: new Date(b.created_at),
        };
      });

      setBookings(parsedBookings);
      console.log(parsedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [id]);

  const handleRangeChange = (range: { start?: DateValue; end?: DateValue }) => {
    setSelectedRange(range);
  };

  const handleDateClick = async (date: DateValue) => {
    try {
      const iso = `${focusedDate.year}-${date.month.toString().padStart(2, "0")}-${date.day.toString().padStart(2, "0")}T00:00:00`;

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

        setSelectedBooking(null);
        return;
      }

      const data = await res.json();

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
        username: data.user.name,
        email: data.user.email,
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
          <Typography
            variant="h5"
            sx={{
              px: 2,
              py: 1,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            {name}
          </Typography>

          <Box sx={{ display: "flex", gap: 4 }}>
            <Box sx={{ flex: 1, py: 3 }}>
              {mode === "view" && (
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    maxWidth: 400,
                    mx: "auto",
                  }}
                >
                  {selectedBooking ? (
                    <>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Bookinginformasjon
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Startdato
                          </Typography>
                          <Typography variant="body1">
                            {selectedBooking.start_time.toLocaleDateString()}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Sluttdato
                          </Typography>
                          <Typography variant="body1">
                            {selectedBooking.end_time.toLocaleDateString()}
                          </Typography>
                        </Box>

                        <Divider />

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Bruker
                          </Typography>
                          <Typography variant="body1">
                            {selectedBooking.username}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            E-post
                          </Typography>
                          <Typography variant="body1">
                            {selectedBooking.email}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      Ingen booking valgt
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
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
              {mode === "view" && (
                <BookedDatesCalendar
                  focusedValue={focusedDate}
                  isDateBooked={(date) => isDateBooked(date, bookings)}
                  onBookedDateClick={(date) => {
                    console.log(date);
                    handleDateClick(date);
                  }}
                />
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
      {selectedRange.start && selectedRange.end && (
        <BookingPopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          startDate={selectedRange.start}
          endDate={selectedRange.end}
          equipmentId={id}
          fetchBookings={fetchBookings}
        />
      )}
    </>
  );
};
