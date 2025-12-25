"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceReportFilters } from "@/components/attendance-summary/AttendanceReportFilters";
// import { AttendanceSummaryTable } from "@/components/attendance-summary/AttendanceSummaryTable"; // Will be added later

const AttendanceSummary = () => {
  const [, setFilters] = useState({ // 'filters' est ignoré pour l'instant car non utilisé directement ici
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    teamMemberId: "" as string,
    reportType: "daily" as "daily" | "weekly" | "monthly",
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Rapports de Présence</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Consultez les résumés de présence par jour, semaine ou mois.
      </p>
      <div className="grid grid-cols-1 gap-6">
        <AttendanceReportFilters onApplyFilters={setFilters} />
        <Card>
          <CardHeader>
            <CardTitle>Résumé des Présences</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <AttendanceSummaryTable filters={filters} /> */}
            <p className="text-muted-foreground">
              Sélectionnez les filtres ci-dessus pour afficher le rapport.
              Le tableau de résumé sera affiché ici.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceSummary;