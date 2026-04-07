import { useEffect, useState } from "react";
import type { DateValue } from "react-aria-components";

export type Booking = {
  start: Date;
  end: Date;
  title: string;
  timeSlot?: string;
  userId?: string;
};

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function load() {
      // Bytt senere
      const mock: Booking[] = [
        { start: new Date(2026, 1, 12), end: new Date(2026, 1, 14), title: "Hyttetur" }, // obs: 0 = jan, 1 = feb
        { start: new Date(2026, 1, 28), end: new Date(2026, 1, 28), title: "Møte" },
        { start: new Date(2026, 2, 18), end: new Date(2026, 2, 23), title: "Blåtur" },
        { start: new Date(2026, 2, 27), end: new Date(2026, 2, 27), title: "Vors" }
      ]; // TODO: importer samme typer og variabler som booking.py i backend (./././././server/app/models/booking.py)! Limt inn her:
      {/* from app.database import Base

class Booking(Base):
    __tablename__ = 'booking'
    id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('equipment.id', ondelete='CASCADE'), nullable=False,index=True)
    user_id : Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    booking_destination: Mapped[Geography] = mapped_column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    equipment : Mapped["Equipment"] = relationship("Equipment", back_populates="bookings")
    user: Mapped["User"] = relationship("User", back_populates="bookings")    

TODO: lag samme mock Bookings som ovenfor bare med denne klassetypen, slik at det blir enklere å overføre funksjonene senere
     */}
      setBookings(mock);
    }

    load();
  }, []);

  function isDateBooked(dateValue: DateValue) {
    const d = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
    return bookings.some(b => b.start <= d && b.end >= d);
  }

  function getBookingForDate(dateValue: DateValue) {
    const d = new Date(dateValue.year, dateValue.month - 1, dateValue.day);
    return bookings.find(b => b.start <= d && b.end >= d);
  }

  return { bookings, isDateBooked, getBookingForDate };
}
