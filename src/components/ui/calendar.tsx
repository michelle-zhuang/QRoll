import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import "react-day-picker/style.css";
import { cn } from "src/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center h-9",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "space-x-1 flex items-center absolute right-3 top-3",
        button_previous: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-lg flex items-center justify-center hover:bg-muted/80 cursor-pointer",
        button_next: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-lg flex items-center justify-center hover:bg-muted/80 cursor-pointer",
        month_grid: "w-full border-collapse space-y-1 mt-4",
        weekday: "text-muted-foreground rounded-md w-9 font-semibold text-[0.8rem] text-center",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: "h-9 w-9 p-0 font-normal rounded-xl hover:bg-muted text-foreground transition-all flex items-center justify-center cursor-pointer",
        selected: "[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:font-semibold [&_button]:rounded-xl [&_button]:hover:bg-primary",
        today: "[&_button]:border-2 [&_button]:border-accent [&_button]:font-semibold [&_button]:text-primary",
        outside: "text-muted-foreground/50 opacity-50",
        disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
