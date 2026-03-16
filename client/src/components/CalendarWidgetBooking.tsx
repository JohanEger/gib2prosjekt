import type { Booking } from '../types';

interface Props {
  booking: Booking;
}

export const CalendarWidgetBooking: React.FC<Props> = ({ booking }) => (
  <div>
    <strong>{booking.booking_destination}</strong>
    <p>Fra: {booking.start_time}</p>
    <p>Til: {booking.end_time}</p>
  </div>
);