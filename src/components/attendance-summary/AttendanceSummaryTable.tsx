"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showError } from "@/utils/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth } from "date-fns"; // Removed endOfMonth
import { fr } from "date-fns/locale";

interface DailyAttendance {
  id: string;
  team_member_id: string;
  team_members: { name: string };
  attendance_date: string;
  status: string;
  hours_worked: number | null;
  description: string | null;
  created_at: string;
}

interface AttendanceReportFilters {
  startDate: Date | undefined;
  endDate: Date | undefined;
  teamMemberId: string;
  reportType: "daily" | "weekly" | "monthly";
}

interface AttendanceSummaryTableProps {
  filters: AttendanceReportFilters;
}

export const AttendanceSummaryTable = ({ filters }: AttendanceSummaryTableProps) => {
  const { user } = useSession();
  const { startDate, endDate, teamMemberId, reportType } = filters;

  const { data: rawAttendances, isLoading, error } = useQuery<DailyAttendance[]>({
    queryKey: ["attendance_summary", user?.id, startDate, endDate, teamMemberId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("daily_attendances")
        .select("*, team_members(name)")
        .eq("user_id", user.id);

      if (teamMemberId) {
        query = query.eq("team_member_id", teamMemberId);
      }
      if (startDate) {
        query = query.gte("attendance_date", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        query = query.lte("attendance_date", format(endDate, "yyyy-MM-dd"));
      }

      query = query.order("attendance_date", { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user,
  });

  const aggregatedData = useMemo(() => {
    if (!rawAttendances) return [];

    if (reportType === "daily") {
      return rawAttendances.map(att => ({
        period: format(new Date(att.attendance_date), "PPP", { locale: fr }),
        teamMemberName: att.team_members?.name || "N/A",
        status: att.status,
        hoursWorked: att.hours_worked,
        description: att.description,
      }));
    }

    const grouped: { [key: string]: {
      teamMemberName: string;
      totalHours: number;
      presentDays: number;
      absentDays: number;
      leaveDays: number;
      sickDays: number;
      holidayDays: number;
    }[] } = {};

    rawAttendances.forEach(att => {
      const date = new Date(att.attendance_date);
      let periodDisplay: string;

      if (reportType === "weekly") {
        const weekStart = startOfWeek(date, { locale: fr });
        const weekEnd = endOfWeek(date, { locale: fr });
        periodDisplay = `Semaine du ${format(weekStart, "PPP", { locale: fr })} au ${format(weekEnd, "PPP", { locale: fr })}`;
      } else { // monthly
        const monthStart = startOfMonth(date);
        periodDisplay = format(monthStart, "MMMM yyyy", { locale: fr });
      }

      if (!grouped[periodDisplay]) {
        grouped[periodDisplay] = [];
      }

      let memberEntry = grouped[periodDisplay].find(entry => entry.teamMemberName === (att.team_members?.name || "N/A"));

      if (!memberEntry) {
        memberEntry = {
          teamMemberName: att.team_members?.name || "N/A",
          totalHours: 0,
          presentDays: 0,
          absentDays: 0,
          leaveDays: 0,
          sickDays: 0,
          holidayDays: 0,
        };
        grouped[periodDisplay].push(memberEntry);
      }

      memberEntry.totalHours += att.hours_worked || 0;
      if (att.status === "Present") memberEntry.presentDays++;
      if (att.status === "Absent") memberEntry.absentDays++;
      if (att.status === "Leave") memberEntry.leaveDays++;
      if (att.status === "Sick") memberEntry.sickDays++;
      if (att.status === "Holiday") memberEntry.holidayDays++;
    });

    const result: any[] = [];
    Object.keys(grouped).sort((a, b) => {
      // Sort periods chronologically
      const dateA = reportType === "weekly" ? startOfWeek(new Date(a.split('du ')[1].split(' au ')[0]), { locale: fr }) : startOfMonth(new Date(a));
      const dateB = reportType === "weekly" ? startOfWeek(new Date(b.split('du ')[1].split(' au ')[0]), { locale: fr }) : startOfMonth(new Date(b));
      return dateB.getTime() - dateA.getTime(); // Descending order
    }).forEach(periodDisplay => {
      grouped[periodDisplay].forEach(entry => {
        result.push({
          period: periodDisplay,
          ...entry,
        });
      });
    });

    return result;
  }, [rawAttendances, reportType, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Chargement du rapport de présence...</p>
      </div>
    );
  }

  if (error) {
    showError("Erreur lors du chargement du rapport de présence: " + error.message);
    return (
      <p className="text-red-500">
        Erreur lors du chargement du rapport de présence: {error.message}
      </p>
    );
  }

  if (!rawAttendances || rawAttendances.length === 0) {
    return (
      <p className="text-muted-foreground">
        Aucune donnée de présence trouvée pour les filtres sélectionnés.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{reportType === "daily" ? "Date" : "Période"}</TableHead>
            <TableHead>Membre de l'équipe</TableHead>
            {reportType === "daily" ? (
              <>
                <TableHead>Statut</TableHead>
                <TableHead>Heures travaillées</TableHead>
                <TableHead>Description</TableHead>
              </>
            ) : (
              <>
                <TableHead>Jours Présents</TableHead>
                <TableHead>Jours Absents</TableHead>
                <TableHead>Jours Congé</TableHead>
                <TableHead>Jours Maladie</TableHead>
                <TableHead>Jours Fériés</TableHead>
                <TableHead>Total Heures</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregatedData.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{row.period}</TableCell>
              <TableCell>{row.teamMemberName}</TableCell>
              {reportType === "daily" ? (
                <>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.hoursWorked !== null ? row.hoursWorked : "N/A"}</TableCell>
                  <TableCell>{row.description || "N/A"}</TableCell>
                </>
              ) : (
                <>
                  <TableCell>{row.presentDays}</TableCell>
                  <TableCell>{row.absentDays}</TableCell>
                  <TableCell>{row.leaveDays}</TableCell>
                  <TableCell>{row.sickDays}</TableCell>
                  <TableCell>{row.holidayDays}</TableCell>
                  <TableCell>{row.totalHours.toFixed(1)}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};