"use client";

import { AddDailyAttendanceForm } from "@/components/daily-attendance/AddDailyAttendanceForm";
import { DailyAttendanceList } from "@/components/daily-attendance/DailyAttendanceList";

const DailyAttendance = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Suivi des Présences Quotidiennes</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Enregistrez et consultez les présences de votre équipe par jour.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddDailyAttendanceForm />
        <DailyAttendanceList />
      </div>
    </div>
  );
};

export default DailyAttendance;