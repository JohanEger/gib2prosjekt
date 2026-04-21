import * as React from "react";
import {
  Paper,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  IconButton,
  FormControl,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Divider } from "@mui/material";
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
import { useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import TodayIcon from '@mui/icons-material/Today';

const API_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

//import { API_BASE } from "@/apiBase";
import { useAuth } from "../hooks/useAuth";

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
  phone_number: number;
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


  /*   const maxDateObj = new Date(today.year + 1, today.month - 1, today.day);
    const maxDateStr = `${maxDateObj.getFullYear()}-${(maxDateObj.getMonth() + 1).toString().padStart(2, "0")}-${maxDateObj.getDate().toString().padStart(2, "0")}`;
    const maxDate = parseDate(maxDateStr); */


  const handleRangeChange = (range: { start?: DateValue; end?: DateValue }) => {
    setSelectedRange(range);
  };

  const navigate = useNavigate();

  const handleGoBackToHomePage = () => {
    navigate("/", { state: { openEquipmentId: id, openEquipmentName: name } });
  };

  const handleGoToToday = () => {
    setSelectedRange({ start: today, end: today });
    setFocusedDate(today);
    setSelectedYear(today.year);
  };

  const [selectedYear, setSelectedYear] = useState<number>(today.year); //La til for å få appen til å kjøre, ta vekk?

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: currentYear + 1 - 2002 + 1 }, //Året linjeforeningen ble til, kan evt endre til +- 1 år
    (_, i) => currentYear + 1 - i
  );



  const handleOpenPopup = () => setPopupOpen(true);
  const handleClosePopup = () => setPopupOpen(false);

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
        phone_number: data.user.phone_number,
      };
      setSelectedBooking(parsedBooking);
    } catch (err) {
      console.error("FETCH FAILED:", err);
      setSelectedBooking(null);
    }

    const handleGoToToday = () => {
      setSelectedRange({ start: today, end: today });
      setFocusedDate(today);
      setSelectedYear(today.year);
    };
  };

  return (
    <>
      <NavBar />
      <Box sx={{ mt: "8em", display: "flex", justifyContent: "center", px: 1 }}>
        <Paper
          elevation={0}
          sx={{
            minWidth: { xs: "auto", md: 800 },
            width: "fit-display",
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
            <Typography variant="h4" pl="16px">
              {name}
            </Typography>
          </Box>
          <Box />


          <Box sx={{ display: "flex", gap: 4 , flexDirection: { xs: "column", md: "row" }}} >
            <Box sx={{ flex: 1, py: 3 }}>
              {mode === "view" && (
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    maxWidth: 500,
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
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Telefonnummer
                          </Typography>
                          <Typography variant="body1">
                            {selectedBooking.phone_number}
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
                  Se bookinger
                </Typography>
              </Box>

              {(mode === "book" || mode === "view") && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "row" }}>
                    <Select
                      value={selectedYear}
                      sx={{
                        fontSize: "0.75rem",
                        maxHeight: 180,
                        overflowY: "auto",
                        "& .MuiSelect-select": {
                          padding: "6px 10px",
                        },
                      }}
                      onChange={(e) => {
                        const year = Number(e.target.value);
                        setSelectedYear(year);
                        setFocusedDate(
                          parseDate(
                            `${year}-${String(focusedDate.month).padStart(2, "0")}-${String(
                              focusedDate.day
                              ).padStart(2, "0")}`
                            ));
                          }}>
                      {years.map((y) => (
                        <MenuItem key={y} value={y} sx={{
                          fontSize: "0.85rem",
                          //minHeight: 6,
                          maxHeight: 24,
                        }}>
                          {y}
                        </MenuItem>
                      ))}
                    </Select>

                    <Button variant="text"
                      startIcon={<TodayIcon></TodayIcon>}
                      sx={{ fontSize: "0.65rem", color: "black", textTransform: "none", paddingLeft: 3}}
                      onClick={handleGoToToday}>
                      I dag
                    </Button>
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
                        <Button sx={{ mt: 2, fontWeight: 700}} onClick={() => setPopupOpen(true)}>
                          Book
                        </Button>
                      )}
                    </>
                  )}

                  {mode === "view" && (
                    <BookedDatesCalendar
                    focusedValue={focusedDate}
                    onFocusChange={(date) => {
                      if (date) setFocusedDate(date);
                    }
                    
                  }
                  isDateBooked={(date) => isDateBooked(date, bookings)}
                  onBookedDateClick={(date) => {
                    console.log(date);
                    handleDateClick(date);
                  }}
                  />
                  )}
                </Box>
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
