import * as React from "react";
import { Paper, Typography, Button, Box } from "@mui/material";
import { NavBar } from "../components/NavBar";
import SearchBox from "../components/SearchBox";
import { JollyRangeCalendar } from "@/components/Calendar";
import { Select, MenuItem } from "@mui/material";
import type { DateValue } from "react-aria-components";
import { parseDate, getLocalTimeZone, today as todayAria } from "@internationalized/date";

export default function CalendarPage() {
  const [selectedRange, setSelectedRange] = React.useState<{ start?: DateValue; end?: DateValue }>({});

  const today = todayAria(getLocalTimeZone());

  const [selectedYear, setSelectedYear] = React.useState(2026)
  const [visibleMonth, setVisibleMonth] = React.useState<DateValue>(today);
  const handleMonthChange = (date: DateValue) => {
    setVisibleMonth(date);
    setSelectedYear(date.year);
  };

  const [focusedDate, setFocusedDate] = React.useState<DateValue>(today);

  // maxDate = ett år frem
  const maxDateObj = new Date(today.year + 1, today.month - 1, today.day);
  const maxDateStr = `${maxDateObj.getFullYear()}-${(maxDateObj.getMonth() + 1).toString().padStart(2, "0")}-${maxDateObj.getDate().toString().padStart(2, "0")}`;
  const maxDate = parseDate(maxDateStr);

  function dateValueToDate(d: DateValue): Date {
    return new Date(d.year, d.month - 1, d.day);
  }

  type User = { id: string; name: string; email: string; class: number };
  const mockUser: User[] = [
    { id: "Test1", name: "Adam Hansen", email: "adam@hansen.no", class: 3 },
    { id: "Test2", name: "Eva Olsen", email: "eva@olsen.no", class: 2 },
  ];

  type Booking = {
    start: Date;
    end: Date;
    title: string;
    timeSlot: "00-08" | "08-12" | "12-16" | "16-20" | "20-00" | "hele dagen";
    userId: string;
  };

  const mockbookings: Booking[] = [
    { start: new Date(2026, 1, 12), end: new Date(2026, 1, 14), title: "Hyttetur", timeSlot: "hele dagen", userId: "Test1" },
    { start: new Date(2026, 1, 28), end: new Date(2026, 1, 28), title: "Møte", timeSlot: "12-16", userId: "Test2" },
  ];

  function isDateBooked(date: DateValue, bookings: Booking[]): boolean {
    const d = new Date(date.year, date.month - 1, date.day);
    return bookings.some(
      (b) => b.start <= d && b.end >= d
    );
  }

  const handleGoToToday = () => {
    setSelectedRange({ start: today, end: today });
    setFocusedDate(today);
    setSelectedYear(today.year);
  };

  const getBookingsForRange = (range: { start?: DateValue; end?: DateValue }) => {
    if (!range.start || !range.end) return [];
    const startDate = dateValueToDate(range.start);
    const endDate = dateValueToDate(range.end);
    return mockbookings.filter(b => b.start <= endDate && b.end >= startDate);
  };


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
            pt: 10
          }}
        >

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 4,
            }}
          >
            {/* Venstre */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Søk etter utstyr / brukere
                </Typography>
                <SearchBox />
              </Box>

              {selectedRange.start && selectedRange.end && (
                <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: "#ffffffff", borderRadius: 1 }}>
                  {(() => {
                    const startDate = dateValueToDate(selectedRange.start!);
                    const endDate = dateValueToDate(selectedRange.end!);

                    // Finn alle bookinger i intervallet
                    const bookingsInRange = getBookingsForRange(selectedRange);

                    // Sjekk om det er bare én dag valgt
                    const isSingleDay = startDate.getTime() === endDate.getTime();

                    if (bookingsInRange.length === 0) {
                      return (
                        <Typography variant="body1">
                          {isSingleDay
                            ? "Denne dagen er ikke booket"
                            : "Ingen av dagene du har valgt er booket"}
                        </Typography>
                      );
                    } else if (!isSingleDay) {
                      // Flere dager valgt, og minst én booket
                      return (
                        <Typography variant="body1" color="error">
                          En av dagene du har valgt er booket
                        </Typography>

                      );
                    }

                    // Hvis én dag og den er booket, vis detaljene
                    return bookingsInRange.map((b, i) => {
                      const user = mockUser.find((u) => u.id === b.userId);
                      return (
                        <Box key={i} sx={{ mb: 2, p: 1, borderBottom: "1px solid #ddd" }}>
                          <Typography variant="body1" color="error">
                            Denne datoen er booket!
                          </Typography>
                          <Typography variant="body2">{`Av: ${user?.name ?? "Ukjent bruker"}`}</Typography>
                          <Typography variant="body2">{`For: ${b.title}`}</Typography>
                          <Typography variant="body2">{`Tidspunkt: ${b.timeSlot}`}</Typography>
                        </Box>
                      );
                    });
                  })()}
                </Paper>
              )}
            </Box>

            {/* Høyre panel: kalender */}

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  minHeight: 400,
                  gap: 2,
                }}
              >
                <Select
                  size="small"
                  value={selectedYear}
                  onChange={(e) => {
                    const year = Number(e.target.value);
                    setSelectedYear(year);

                    setFocusedDate(
                      parseDate(`${year}-${focusedDate.month.toString().padStart(2, "0")}-01`)
                    );
                  }}
                >
                  {Array.from({ length: today.year + 2 - 2002 }, (_, i) => 2002 + i).map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
                <JollyRangeCalendar
                  focusedValue={focusedDate}
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
                  onChange={(range) => setSelectedRange(range)}
                  minValue={parseDate("2002-01-01")}
                  maxValue={maxDate}
                />

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleGoToToday}
                >
                  Gå til dagens dato
                </Button>
              </Paper>


            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
}