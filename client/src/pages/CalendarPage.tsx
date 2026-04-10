import * as React from "react";
import {
  Paper,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { NavBar } from "../components/NavBar";
import SearchBox from "../components/SearchBox";
import type { DateValue } from "react-aria-components";
import {
  parseDate,
  getLocalTimeZone,
  today as todayAria,
} from "@internationalized/date";
import { BookingRangeCalendar } from "@/components/calendar/BookingRangeCalendar";
import { BookedDatesCalendar } from "@/components/calendar/BookedDatesCalendar";
import BookingPopup from "@/components/BookingPopup";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from "react-router-dom";


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

function isDateBooked(date: DateValue, bookings: Booking[]): boolean {
  const current = toDateOnly(new Date(date.year, date.month - 1, date.day));

  return bookings.some((b) => {
    const start = toDateOnly(b.start_time);
    const end = toDateOnly(b.end_time);

    return start <= current && end >= current;
  });
}

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function rangeOverlapsBooking(
  range: { start?: DateValue; end?: DateValue },
  bookings: Booking[],
) {
  if (!range.start || !range.end) return false;

  const start = new Date(
    range.start.year,
    range.start.month - 1,
    range.start.day,
  );
  const end = new Date(range.end.year, range.end.month - 1, range.end.day);

  return bookings.some((b) => b.start_time <= end && b.end_time >= start);
}

function getBookingsForRange(
  range: { start?: DateValue; end?: DateValue },
  bookings: Booking[],
) {
  if (!range.start || !range.end) return [];
  const startDate = dateValueToDate(range.start);
  const endDate = dateValueToDate(range.end);
  return bookings.filter(
    (b) => b.start_time <= endDate && b.end_time >= startDate,
  );
}

function getBookingForDate(date: DateValue, bookings: Booking[]) {
  const d = dateValueToDate(date);
  return bookings.find((b) => b.start_time <= d && b.end_time >= d);
}

export const CalendarPage = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  const today = todayAria(getLocalTimeZone());
  const [mode, setMode] = React.useState<"book" | "view">("book");
  const [selectedRange, setSelectedRange] = React.useState<{
    start?: DateValue;
    end?: DateValue;
  }>({});
  const [focusedDate, setFocusedDate] = React.useState<DateValue>(today);
  const [selectedYear, setSelectedYear] = React.useState(today.year);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [popupOpen, setPopupOpen] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<
    Booking | undefined
  >();
  const [openDialog, setOpenDialog] = React.useState(false);

  const maxDateObj = new Date(today.year + 1, today.month - 1, today.day);
  const maxDateStr = `${maxDateObj.getFullYear()}-${(maxDateObj.getMonth() + 1).toString().padStart(2, "0")}-${maxDateObj.getDate().toString().padStart(2, "0")}`;
  const maxDate = parseDate(maxDateStr);

  const navigate = useNavigate();

  const handleGoBackToHomePage = () => {
    navigate("/", { state: { openEquipmentId: id, openEquipmentName: name } });
  };

  const handleRangeChange = (range: { start?: DateValue; end?: DateValue }) => {
    if (!range.start || !range.end) {
      setSelectedRange(range);
      return;
    }
    if (rangeOverlapsBooking(range, bookings)) {
      console.warn("Kan ikke booke over allerede bookede dager");
      return;
    }
    setSelectedRange(range);
  };

  const handleGoToToday = () => {
    setSelectedRange({ start: today, end: today });
    setFocusedDate(today);
    setSelectedYear(today.year);
  };

  const handleOpenPopup = () => setPopupOpen(true);
  const handleClosePopup = () => setPopupOpen(false);

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

  return (
    <>
      <NavBar />
      <Box sx={{ mt: "8em", display: "flex", justifyContent: "center", px: 1 }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "1000px",
            minHeight: "70vh",
            p: 4,
            pt: 4,
          }}
        >
          <IconButton onClick={handleGoBackToHomePage} className="absolute">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h3" pl="10px">{name}</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
            }}
          >
            {/* Venstre panel */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Søk etter utstyr / brukere
                </Typography>
                <SearchBox />
              </Box>
              {selectedRange.start && selectedRange.end && (
                <Paper
                  elevation={0}
                  sx={{ mt: 2, p: 2, bgcolor: "#ffffffff", borderRadius: 1 }}
                >
                  {getBookingsForRange(selectedRange, bookings).length === 0 ? (
                    <Typography variant="body1">
                      *Informasjon om bookinger skal komme her etterhvert*
                    </Typography>
                  ) : (
                    getBookingsForRange(selectedRange, bookings).map((b, i) => {
                      return (
                        <Box
                          key={i}
                          sx={{ mb: 2, p: 1, borderBottom: "1px solid #ddd" }}
                        >
                          <Typography variant="body1" color="error">
                            Denne datoen er booket
                          </Typography>
                        </Box>
                      );
                    })
                  )}
                </Paper>
              )}
            </Box>

            {/* Høyre panel */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              {/* Mode-navbar som tabs */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Typography
                  onClick={() => setMode("book")}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: "pointer",
                    borderBottom: mode === "book" ? 2 : 0,
                    borderColor:
                      mode === "book" ? "primary.main" : "transparent",
                    fontWeight: mode === "book" ? "bold" : "normal",
                    color: mode === "book" ? "primary.main" : "text.primary",
                    "&:hover": { color: "primary.dark" },
                  }}
                >
                  Book selv
                </Typography>

                <Typography
                  onClick={() => setMode("view")}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: "pointer",
                    borderBottom: mode === "view" ? 2 : 0,
                    borderColor:
                      mode === "view" ? "primary.main" : "transparent",
                    fontWeight: mode === "view" ? "bold" : "normal",
                    color: mode === "view" ? "primary.main" : "text.primary",
                    "&:hover": { color: "primary.dark" },
                  }}
                >
                  Se bookinger
                </Typography>
              </Box>

              {/* Paper med kalender */}
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  minHeight: 400,
                  gap: 1,
                  position: "relative",
                }}
              >
                {/* Raden med år og "Gå til i dag" */}
                <Box
                  sx={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* År-dropdown midtstilt */}
                  <Box
                    sx={{ flex: 1, display: "flex", justifyContent: "center" }}
                  >
                    <Select
                      size="small"
                      value={selectedYear}
                      onChange={(e) => {
                        const year = Number(e.target.value);
                        setSelectedYear(year);
                        setFocusedDate(
                          parseDate(
                            `${year}-${focusedDate.month.toString().padStart(2, "0")}-01`,
                          ),
                        );
                      }}
                      sx={{ minWidth: 80 }}
                    >
                      {Array.from(
                        { length: today.year + 2 - 2002 },
                        (_, i) => 2002 + i,
                      ).map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  {/* "Gå til i dag"-knapp helt til høyre */}
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleGoToToday}
                    sx={{
                      color: "black",
                      textTransform: "none",
                      minWidth: "auto",
                      p: 0,
                      position: "absolute",
                      right: 90,
                    }}
                  >
                    Gå til i dag
                  </Button>
                </Box>

                {/* Kalender */}
                {mode === "book" && (
                  <BookingRangeCalendar
                    focusedValue={focusedDate}
                    isDateBooked={(date) => isDateBooked(date, bookings)}
                    onChange={handleRangeChange}
                    onFocusChange={(date) => {
                      if (date) {
                        setFocusedDate(date);
                        setSelectedYear(date.year);
                      }
                    }}
                    value={
                      selectedRange.start && selectedRange.end
                        ? { start: selectedRange.start, end: selectedRange.end }
                        : undefined
                    }
                    minValue={parseDate("2002-01-01")}
                    maxValue={maxDate}
                  />
                )}

                {mode === "view" && (
                  <BookedDatesCalendar
                    focusedValue={focusedDate}
                    isDateBooked={(date) => isDateBooked(date, bookings)}
                    onBookedDateClick={(date) => {
                      const booking = getBookingForDate(date, bookings);
                      setSelectedBooking(booking ?? undefined);
                      setOpenDialog(true);
                    }}
                    onFocusChange={(date) => {
                      if (date) {
                        setFocusedDate(date);
                        setSelectedYear(date.year);
                      }
                    }}
                    minValue={parseDate("2002-01-01")}
                    maxValue={maxDate}
                  />
                )}

                {/* Fast plass til knappen */}
                <Box sx={{ height: 48, display: "flex", alignItems: "center" }}>
                  {mode === "book" &&
                    selectedRange.start &&
                    selectedRange.end && (
                      <Button
                        variant="outlined"
                        sx={{ fontWeight: "bold" }}
                        size="medium"
                        onClick={handleOpenPopup}
                      >
                        Book
                      </Button>
                    )}
                </Box>
              </Paper>
            </Box>
          </Box>
        </Paper>
      </Box>

      {selectedRange.start && selectedRange.end && (
        <BookingPopup
          open={popupOpen}
          onClose={handleClosePopup}
          startDate={selectedRange.start}
          endDate={selectedRange.end}
          equipmentId={id}
          fetchBookings={fetchBookings}
        />
      )}
      {/* TODO: Legge til at informasjon vises om bookingene. Egen popup? Til venstre? */}
    </>
  );
};
