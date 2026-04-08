import * as React from "react";
import {
  Paper,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

type User = { id: string; name: string; email: string; class: number };
type Booking = {
  start: Date;
  end: Date;
  title: string;
  timeSlot: "hele dagen";
  userId: string;
};

// Mockbookings. TODO: fjerne og fikse så tidspunkt funker
const mockUser: User[] = [
  { id: "Test1", name: "Adam Hansen", email: "adam@hansen.no", class: 3 },
  { id: "Test2", name: "Eva Olsen", email: "eva@olsen.no", class: 2 },
];

function dateValueToDate(d: DateValue): Date {
  return new Date(d.year, d.month - 1, d.day);
}

function isDateBooked(date: DateValue, bookings: Booking[]): boolean {
  const d = dateValueToDate(date);
  return bookings.some((b) => b.start <= d && b.end >= d);
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

  return bookings.some((b) => b.start <= end && b.end >= start);
}

function getBookingsForRange(
  range: { start?: DateValue; end?: DateValue },
  bookings: Booking[],
) {
  if (!range.start || !range.end) return [];
  const startDate = dateValueToDate(range.start);
  const endDate = dateValueToDate(range.end);
  return bookings.filter((b) => b.start <= endDate && b.end >= startDate);
}

function getBookingForDate(date: DateValue, bookings: Booking[]) {
  const d = dateValueToDate(date);
  return bookings.find((b) => b.start <= d && b.end >= d);
}

export const CalendarPage = () => {
  const { id, name } = useParams<{ id: string; name: string }>();
  const today = todayAria(getLocalTimeZone());
  console.log(name, id);
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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_BASE}/booking`);
        const data = await res.json();
        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
    console.log(bookings);
  }, []);

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
            pt: 10,
          }}
        >
          <Typography>{name}</Typography>
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
                      const user = mockUser.find((u) => u.id === b.userId);
                      return (
                        <Box
                          key={i}
                          sx={{ mb: 2, p: 1, borderBottom: "1px solid #ddd" }}
                        >
                          <Typography variant="body1" color="error">
                            Denne datoen er booket
                          </Typography>
                          <Typography variant="body2">{`Av: ${user?.name ?? "Ukjent bruker"}`}</Typography>
                          <Typography variant="body2">{`For: ${b.title}`}</Typography>
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

      {/* BookingPopup */}
      {selectedRange.start && selectedRange.end && (
        <BookingPopup
          open={popupOpen}
          onClose={handleClosePopup}
          startDate={selectedRange.start}
          endDate={selectedRange.end}
        />
      )}
      {/* TODO: Legge til at informasjon vises om bookingene. Egen popup? Til venstre? */}
    </>
  );
};
