import * as React from "react";
import {
    Calendar as AriaCalendar,
    RangeCalendar as AriaRangeCalendar,
    CalendarGrid as AriaCalendarGrid,
    CalendarGridHeader as AriaCalendarGridHeader,
    CalendarGridBody as AriaCalendarGridBody,
    CalendarHeaderCell as AriaCalendarHeaderCell,
    CalendarCell as AriaCalendarCell,
    Heading as AriaHeading,
    Button as AriaButton,
    Text,
    useLocale,
    composeRenderProps,
    type DateValue as AriaDateValue,
    type RangeCalendarProps as AriaRangeCalendarProps,
    type CalendarGridProps as AriaCalendarGridProps,
    type CalendarGridHeaderProps as AriaCalendarGridHeaderProps,
    type CalendarGridBodyProps as AriaCalendarGridBodyProps,
    type CalendarHeaderCellProps as AriaCalendarHeaderCellProps,
    type CalendarCellProps as AriaCalendarCellProps,
    type CalendarProps as AriaCalendarProps,
    type RangeValue
} from "react-aria-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Button } from "@/components/ui/button";

const RangeCalendar = AriaRangeCalendar;

const CalendarHeading = (props: React.HTMLAttributes<HTMLElement>) => {
    const { direction } = useLocale();
    return (
        <header className="flex w-full items-center gap-1 px-1 pb-4" {...props}>
            <AriaButton
                slot="previous"
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-7 bg-transparent p-0 opacity-50",
                    "data-[hovered]:opacity-100"
                )}
            >
                {direction === "rtl" ? (
                    <ChevronRight aria-hidden className="size-4" />
                ) : (
                    <ChevronLeft aria-hidden className="size-4" />
                )}
            </AriaButton>
            <AriaHeading className="grow text-center text-sm font-medium" />
            <AriaButton
                slot="next"
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-7 bg-transparent p-0 opacity-50",
                    "data-[hovered]:opacity-100"
                )}
            >
                {direction === "rtl" ? (
                    <ChevronLeft aria-hidden className="size-4" />
                ) : (
                    <ChevronRight aria-hidden className="size-4" />
                )}
            </AriaButton>
        </header>
    );
};

const CalendarGrid = ({ className, ...props }: AriaCalendarGridProps) => (
    <AriaCalendarGrid
        className={cn("border-separate border-spacing-x-0 border-spacing-y-1", className)}
        {...props}
    />
);

const CalendarGridHeader = (props: AriaCalendarGridHeaderProps) => (
    <AriaCalendarGridHeader {...props} />
);

const CalendarHeaderCell = ({
    className,
    ...props
}: AriaCalendarHeaderCellProps) => (
    <AriaCalendarHeaderCell
        className={cn(
            "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
            className
        )}
        {...props}
    />
);

const CalendarGridBody = ({
    className,
    ...props
}: AriaCalendarGridBodyProps) => (
    <AriaCalendarGridBody
        className={cn("[&>tr>td]:p-0", className)}
        {...props}
    />
);

interface BookingCalendarCellProps extends AriaCalendarCellProps {
    isDateBooked?: (date: AriaDateValue) => boolean;
}

const BookingCalendarCell = ({
    className,
    isDateBooked,
    ...props
}: BookingCalendarCellProps) => (
    <AriaCalendarCell
        {...props}
        // Tooltip via title-attributt på bookede datoer
        className={composeRenderProps(className, (base, renderProps) =>
            cn(
                base,
                "relative flex size-9 items-center justify-center p-0 text-sm font-normal rounded-md transition-colors",

                // Skjul dager utenfor måneden
                renderProps.isOutsideMonth && "opacity-40 pointer-events-none",

                // Bookede dager (røde)
                isDateBooked?.(renderProps.date) && "bg-red-300 text-red-900",


                // Start av valgt periode
                renderProps.isSelectionStart &&
                "bg-primary text-primary-foreground rounded-l-md",

                // Slutt av valgt periode
                renderProps.isSelectionEnd &&
                "bg-primary text-primary-foreground rounded-r-md",

                // Mellomliggende dager (lys grå)
                renderProps.isSelected &&
                !renderProps.isSelectionStart &&
                !renderProps.isSelectionEnd &&
                "bg-gray-300 text-gray-900 opacity-60",

                // Dagens dato (markert hvis ikke valgt)
                renderProps.date.compare(today(getLocalTimeZone())) === 0 &&
                !renderProps.isSelected &&
                "bg-blue-100 text-blue-900",

                // Utilgjengelige datoer (bookede) – gjør de tydelig "låst"
                renderProps.isUnavailable && "cursor-not-allowed opacity-70",

                "cursor-default"
            )
        )}
    />
);

export interface BookingRangeCalendarProps<T extends AriaDateValue>
    extends AriaRangeCalendarProps<T> {
    errorMessage?: string;
    isDateBooked?: (date: T) => boolean;
}

export function BookingRangeCalendar<T extends AriaDateValue>({
    errorMessage,
    className,
    isDateBooked,
    onChange,
    ...props
}: BookingRangeCalendarProps<T>) {
    const [internalError, setInternalError] = React.useState<string | undefined>(
        undefined
    );

    function rangeOverlapsBooked(range: RangeValue<AriaDateValue>): boolean {
        if (!range.start || !range.end || !isDateBooked) return false;

        let cursor = range.start;
        while (cursor.compare(range.end) <= 0) {
            if (isDateBooked(cursor as T)) return true;
            cursor = cursor.add({ days: 1 });
        }
        return false;
    }

    // Bruk any for å matche React Aria sin generiske signatur uten typekrøll
    function handleChange(range: any) {
        const r = range as RangeValue<T> | null;

        if (!r?.start || !r?.end) {
            setInternalError(undefined);
            onChange?.(r as any);
            return;
        }

        if (rangeOverlapsBooked(r as unknown as RangeValue<AriaDateValue>)) {
            setInternalError(
                "Du kan ikke booke over allerede reserverte datoer. Del opp i to bookinger hvis du vil forbi en blokkert dato."
            );
            return;
        }

        setInternalError(undefined);
        onChange?.(r as any);
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <RangeCalendar
                className={composeRenderProps(className, (base) =>
                    cn("w-fit", base)
                )}
                isDateUnavailable={
                    isDateBooked as unknown as ((date: AriaDateValue) => boolean) | undefined
                }
                onChange={handleChange}
                {...props}
            >
                <CalendarHeading />
                <CalendarGrid>
                    <CalendarGridHeader>
                        {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                    </CalendarGridHeader>
                    <CalendarGridBody>
                        {(date) => (
                            <BookingCalendarCell
                                date={date}
                                isDateBooked={
                                    isDateBooked as unknown as
                                    | ((d: AriaDateValue) => boolean)
                                    | undefined
                                }
                            />
                        )}
                    </CalendarGridBody>
                </CalendarGrid>
                {(internalError || errorMessage) && (
                    <Text slot="errorMessage" className="text-sm text-destructive">
                        {internalError ?? errorMessage}
                    </Text>
                )}
            </RangeCalendar>
        </div>
    );
}

interface BookedDatesCalendarProps<T extends AriaDateValue>
    extends AriaCalendarProps<T> {
    isDateBooked?: (date: T) => boolean;
}

export function BookedDatesCalendar<T extends AriaDateValue>({
    isDateBooked,
    className,
    ...props
}: BookedDatesCalendarProps<T>) {
    return (
        <AriaCalendar
            className={composeRenderProps(className, (base) =>
                cn("w-fit", base)
            )}
            {...props}
        >
            <CalendarHeading />
            <CalendarGrid>
                <CalendarGridHeader>
                    {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                </CalendarGridHeader>
                <CalendarGridBody>
                    {(date) => (
                        <AriaCalendarCell
                            date={date}
                            className={composeRenderProps(
                                "",
                                (_, renderProps) =>
                                    cn(
                                        "relative flex size-9 items-center justify-center p-0 text-sm font-normal rounded-md transition-colors",
                                        renderProps.isOutsideMonth &&
                                        "opacity-0 pointer-events-none",
                                        isDateBooked?.(renderProps.date as T) &&
                                        "bg-red-300 text-red-900"
                                    )
                            )}
                        />
                    )}
                </CalendarGridBody>
            </CalendarGrid>
        </AriaCalendar>
    );
}
