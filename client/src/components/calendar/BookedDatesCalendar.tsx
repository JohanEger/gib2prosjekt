import * as React from "react";
import {
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
} from "react-aria-components";
import type {
  DateValue as AriaDateValue,
  RangeCalendarProps as AriaRangeCalendarProps,
  CalendarGridProps as AriaCalendarGridProps,
  CalendarGridHeaderProps as AriaCalendarGridHeaderProps,
  CalendarGridBodyProps as AriaCalendarGridBodyProps,
  CalendarHeaderCellProps as AriaCalendarHeaderCellProps,
} from "react-aria-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { today, getLocalTimeZone } from "@internationalized/date";

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
          "data-[hovered]:opacity-100",
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
          "data-[hovered]:opacity-100",
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
    className={cn(
      "border-separate border-spacing-x-0 border-spacing-y-1",
      className,
    )}
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
      className,
    )}
    {...props}
  />
);

const CalendarGridBody = ({
  className,
  ...props
}: AriaCalendarGridBodyProps) => (
  <AriaCalendarGridBody className={cn("[&>tr>td]:p-0", className)} {...props} />
);

export interface BookedDatesCalendarProps<
  T extends AriaDateValue,
> extends AriaRangeCalendarProps<T> {
  errorMessage?: string;
  isDateBooked?: (date: T) => boolean;
  onBookedDateClick?: (date: T) => void;
  onGoToToday?: () => void;
}

export function BookedDatesCalendar<T extends AriaDateValue>({
  errorMessage,
  className,
  isDateBooked,
  onBookedDateClick,
  onGoToToday,
  ...props
}: BookedDatesCalendarProps<T>) {
  return (
    <RangeCalendar
      className={composeRenderProps(className, (base) => cn("w-fit", base))}
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
              className={composeRenderProps("", (_, renderProps) =>
                cn(
                  "relative flex size-9 items-center justify-center p-0 text-sm font-normal rounded-md",

                  renderProps.isOutsideMonth &&
                    "opacity-40 pointer-events-none",

                  renderProps.date.compare(today(getLocalTimeZone())) === 0 &&
                    "bg-black text-white",

                  isDateBooked?.(renderProps.date as T) &&
                    "bg-red-600 text-white hover:bg-red-700 cursor-pointer",

                  !isDateBooked?.(renderProps.date as T) &&
                    "opacity-40 text-muted-foreground cursor-default",
                ),
              )}
            >
              {(renderProps) => (
                <div
                  onClick={() => {
                    if (
                      isDateBooked?.(renderProps.date as T) &&
                      onBookedDateClick
                    ) {
                      onBookedDateClick(renderProps.date as T);
                    }
                  }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {renderProps.formattedDate}
                </div>
              )}
            </AriaCalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>

      {onGoToToday && (
        <div className="mt-2 flex justify-end px-1">
          <AriaButton
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-8 px-2 text-xs",
            )}
            onPress={onGoToToday}
          >
            Gå til dagens dato
          </AriaButton>
        </div>
      )}

      {errorMessage && (
        <Text slot="errorMessage" className="text-sm text-destructive">
          {errorMessage}
        </Text>
      )}
    </RangeCalendar>
  );
}
