import * as React from "react";
import {
  Paper,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import { NavBar } from "../components/NavBar";
import type { DateValue } from "react-aria-components";
import {
  getLocalTimeZone,
  parseDate,
  today as todayAria,
} from "@internationalized/date";
import { BookingRangeCalendar } from "@/components/calendar/BookingRangeCalendar";
import { BookedDatesCalendar } from "@/components/calendar/BookedDatesCalendar";
import BookingPopup from "@/components/BookingPopup";
import { useParams, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TodayIcon from "@mui/icons-material/Today";
import { useAuth } from "../hooks/useAuth";

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

interface Booking {
  id: string;
  equipmentId: string;
  userId: string;
  username?: string;
  email?: string;
  start_time: Date;
  end_time: Date;
  latitude: number;
  longitude: number;
  createdAt: Date;
  phone_number?: number;
}

// --- Utils ---
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

// --- Component ---
export const CalendarPage = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

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
  const [selectedYear, setSelectedYear] = useState<number>(today.year);

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear + 1 - 2002 + 1 },
    (_, i) => currentYear + 1 - i,
  );

  // --- Fetch bookings ---
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
        start_time: new Date(b.start_time),
        end_time: new Date(b.end_time),
        latitude: b.latitude,
        longitude: b.longitude,
        createdAt: new Date(b.created_at),
      }));

      setBookings(parsed);
    } catch (err) {
      console.error("Fetch bookings failed:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [id]);

  // --- Handlers ---
  const handleRangeChange = (range: { start?: DateValue; end?: DateValue }) => {
    setSelectedRange(range);
  };

  const handleGoBack = () => {
    navigate("/", { state: { openEquipmentId: id, openEquipmentName: name } });
  };

  const handleGoToToday = () => {
    setSelectedRange({ start: today, end: today });
    setFocusedDate(today);
    setSelectedYear(today.year);
  };

  const handleDateClick = async (date: DateValue) => {
    try {
      const iso = `${focusedDate.year}-${String(date.month).padStart(
        2,
        "0",
      )}-${String(date.day).padStart(2, "0")}T00:00:00`;

      const res = await fetch(
        `${API_BASE}/booking/get_booking_for_date?equipment_id=${id}&start_time=${iso}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        setSelectedBooking(null);
        return;
      }

      const data = await res.json();

      if (!data) {
        setSelectedBooking(null);
        return;
      }

      setSelectedBooking({
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
        phone_number: data.user.phone_number,
      });
    } catch (err) {
      console.error(err);
      setSelectedBooking(null);
    }
  };

  // --- Render ---
  return (
    <>
      <NavBar />

      <Box
        sx={{
          mt: "7em",
          px: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: "100%",
            maxWidth: 1100,
            p: { xs: 2, md: 4 },
            borderRadius: 3,
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <IconButton
              onClick={handleGoBack}
              sx={{
                background: "#f3f4f6",
                "&:hover": { background: "#e5e7eb" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h4" fontWeight={600}>
              {name}
            </Typography>
          </Box>

          {/* MAIN LAYOUT */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
              gap: 4,
            }}
          >
            {/* LEFT PANEL */}
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 3,
                minHeight: 260,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {mode === "view" ? (
                selectedBooking ? (
                  <>
                    {/* HEADER */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Booking
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Detaljer for valgt dato
                      </Typography>
                    </Box>

                    {/* DATE CARD */}
                    <Box
                      sx={{
                        background: "#f9fafb",
                        borderRadius: 2,
                        p: 2,
                        mb: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Periode
                      </Typography>
                      <Typography fontWeight={500}>
                        {selectedBooking.start_time.toLocaleDateString()} →{" "}
                        {selectedBooking.end_time.toLocaleDateString()}
                      </Typography>
                    </Box>

                    {/* USER INFO */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Navn
                        </Typography>
                        <Typography>{selectedBooking.username}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          E-post
                        </Typography>
                        <Typography>{selectedBooking.email}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Telefon
                        </Typography>
                        <Typography>{selectedBooking.phone_number}</Typography>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box textAlign="center">
                    <Typography fontWeight={500} gutterBottom>
                      Ingen booking valgt
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Klikk på en dato i kalenderen for å se detaljer
                    </Typography>
                  </Box>
                )
              ) : (
                <Box textAlign="center">
                  <Typography fontWeight={500} gutterBottom>
                    Klar til å booke
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Velg en periode i kalenderen
                  </Typography>
                </Box>
              )}
            </Paper>
            {/* RIGHT PANEL */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: 520,
              }}
            >
              {/* TABS */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  borderBottom: "1px solid #e5e7eb",
                  mb: 2,
                }}
              >
                {["book", "view"].map((m) => (
                  <Typography
                    key={m}
                    onClick={() => setMode(m as "book" | "view")}
                    sx={{
                      cursor: "pointer",
                      pb: 1,
                      fontWeight: mode === m ? 600 : 400,
                      borderBottom:
                        mode === m
                          ? "2px solid #2563eb"
                          : "2px solid transparent",
                      color: mode === m ? "#111827" : "#6b7280",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: "#2563eb",
                      },
                    }}
                  >
                    {m === "book" ? "Book" : "Se bookinger"}
                  </Typography>
                ))}
              </Box>

              {/* CONTROLS */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Select
                  size="small"
                  value={selectedYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setSelectedYear(y);
                    setFocusedDate(parseDate(`${y}-01-01`));
                  }}
                >
                  {years.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>

                <Button
                  size="small"
                  onClick={handleGoToToday}
                  startIcon={<TodayIcon />}
                  sx={{
                    textTransform: "none",
                  }}
                >
                  I dag
                </Button>
              </Box>

              {/* CALENDAR AREA */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                }}
              >
                {mode === "book" && (
                  <Box>
                    <BookingRangeCalendar
                      focusedValue={focusedDate}
                      isDateBooked={(d) => isDateBooked(d, bookings)}
                      onChange={handleRangeChange}
                      onFocusChange={(d) => d && setFocusedDate(d)}
                    />

                    {selectedRange.start && selectedRange.end && (
                      <Button
                        variant="contained"
                        sx={{ mt: 2, width: "100%" }}
                        onClick={() => setPopupOpen(true)}
                      >
                        Book valgt periode
                      </Button>
                    )}
                  </Box>
                )}

                {mode === "view" && (
                  <BookedDatesCalendar
                    focusedValue={focusedDate}
                    onFocusChange={(d) => d && setFocusedDate(d)}
                    isDateBooked={(d) => isDateBooked(d, bookings)}
                    onBookedDateClick={handleDateClick}
                  />
                )}
              </Box>
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
