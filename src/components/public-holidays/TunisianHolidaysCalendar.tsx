"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tunisianHolidays2025, Holiday } from "@/utils/tunisianHolidays";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export const TunisianHolidaysCalendar = () => {
  const modifiers = React.useMemo(() => {
    const holidayDates = tunisianHolidays2025.map(h => h.date);
    return {
      holiday: holidayDates,
    };
  }, []);

  const modifiersClassNames = {
    holiday: "bg-primary text-primary-foreground rounded-full",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendrier des Jours Fériés 2025</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={undefined} // No specific date selected by default
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            locale={fr}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Jours Fériés 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tunisianHolidays2025.map((holiday: Holiday, index: number) => (
              <li key={index} className="flex items-center justify-between">
                <span className="font-medium">
                  {format(holiday.date, "PPP", { locale: fr })}
                </span>
                <Badge
                  className={
                    holiday.type === "national"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-purple-500 hover:bg-purple-600"
                  }
                >
                  {holiday.name}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};