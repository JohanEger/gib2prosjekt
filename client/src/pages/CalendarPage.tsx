import * as React from "react";
import { Paper, Typography, Button, Box } from "@mui/material";
import { NavBar } from "../components/NavBar";
import SearchBox from "../components/SearchBox";
import { JollyRangeCalendar } from "@/components/Calendar";
import type { DateValue } from "react-aria-components";
import { parseDate, getLocalTimeZone, today as todayAria } from "@internationalized/date";

export default function CalendarPage() {
  const [selectedRange, setSelectedRange] = React.useState<{ start?: DateValue; end?: DateValue }>({});

  const today = todayAria(getLocalTimeZone());

  // maxDate = ett år frem
  const maxDateObj = new Date(today.year + 1, today.month - 1, today.day);
  const maxDateStr = `${maxDateObj.getFullYear()}-${(maxDateObj.getMonth()+1).toString().padStart(2,"0")}-${maxDateObj.getDate().toString().padStart(2,"0")}`;
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

  const handleGoToToday = () => {
    setSelectedRange({ start: today, end: today });
  };

  const getBookingsForRange = (range: { start?: DateValue; end?: DateValue }) => {
    if (!range.start || !range.end) return [];
    const startDate = dateValueToDate(range.start);
    const endDate = dateValueToDate(range.end);
    return mockbookings.filter(b => b.start <= endDate && b.end >= startDate);
  };

  const bookingsInRange = getBookingsForRange(selectedRange);

  return (
    <>
      <NavBar />
      <Paper elevation={3} className="p-6 max-w-l mx-auto mt-8" sx={{ width: "60%", minHeight: "60vh" }}>
        <Typography variant="h5" gutterBottom sx={{ pl: 5 }}>
          Kalender
        </Typography>

        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          {/* Venstre panel: booking info */}
          <Box sx={{ width: "50%", pl: 5, mt: 2 }}>
            <SearchBox />

            {selectedRange.start && selectedRange.end && (
              <Paper elevation={0} sx={{ mt: 5, p: 1 }}>
                {bookingsInRange.length > 0 ? (
                  bookingsInRange.map((b, i) => {
                    const user = mockUser.find(u => u.id === b.userId);
                    return (
                      <div key={i}>
                        <Typography variant="body1" color="error">
                          Denne datoen er booket!
                        </Typography>
                        <Typography variant="body2">{`Av: ${user?.name ?? "Ukjent bruker"}`}</Typography>
                        <Typography variant="body2">{`For: ${b.title}`}</Typography>
                        <Typography variant="body2">{`Tidspunkt: ${b.timeSlot}`}</Typography>
                      </div>
                    );
                  })
                ) : (
                  <Typography variant="body1">Det er fortsatt mulig å booke disse dagene.</Typography>
                )}
              </Paper>
            )}
          </Box>

          {/* Høyre panel: kalender */}
          <Box sx={{ width: "50%", pl: 3, pr: 6, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <JollyRangeCalendar
              value={selectedRange.start && selectedRange.end ? { start: selectedRange.start, end: selectedRange.end } : undefined}
              onChange={(range) => setSelectedRange(range)}
              minValue={today} // valgbare datoer starter i dag
              maxValue={maxDate} // valgbare datoer til ett år frem
            />

            <Button variant="outlined" size="small" onClick={handleGoToToday} sx={{ mt: 2, mr: 5 }}>
              Gå til dagens dato
            </Button>
          </Box>
        </Box>
      </Paper>
    </>
  );
}