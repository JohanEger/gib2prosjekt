import { PickersDay, type PickersDayProps } from "@mui/x-date-pickers";

type Booking = {
    start: Date;
    end: Date;
    title: string;
    timeSlot: string;
    userId: string;
};

export function BookingDay(
    props: PickersDayProps & { bookings?: Booking[] }
) {
    const { day, bookings = [], ...other } = props;

    const booking = bookings.find(
        (b) => day >= b.start && day <= b.end
    );

    if (!booking) {
        return <PickersDay {...other} day={day} />;
    }

    const color = booking.timeSlot === "hele dagen" ? "#ed4b4bff" : "#facc15";

    const isStart = day.getTime() === booking.start.getTime();
    const isEnd = day.getTime() === booking.end.getTime();
    const isSingleDay = booking.start.getTime() === booking.end.getTime();

    let borderRadius = 'string';
    let mx = '0';
    if (isSingleDay) {
        borderRadius = '50%';
    } else if (isStart) {
        borderRadius = '50% 0 0 50%'; 
    } else if (isEnd) {
        borderRadius = '0 50% 50% 0'; 
    } else {
        borderRadius = '0';
        mx = '-1px'; 
    }

    return (
        <PickersDay
            {...other}
            day={day}
            sx={{
                backgroundColor: color,
                borderRadius,
                marginLeft: mx,
                marginRight: mx,
                "&:hover": { backgroundColor: color },
            }}
        />
    );
}