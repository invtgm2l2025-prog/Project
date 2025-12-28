"use client";

import { TunisianHolidaysCalendar } from "@/components/public-holidays/TunisianHolidaysCalendar";

const PublicHolidays = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Jours Fériés Tunisiens 2025</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Consultez les jours fériés nationaux et religieux pour l'année 2025.
      </p>
      <TunisianHolidaysCalendar />
    </div>
  );
};

export default PublicHolidays;