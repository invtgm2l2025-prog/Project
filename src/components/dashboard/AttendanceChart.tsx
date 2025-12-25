"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showError } from "@/utils/toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DailyAttendance {
  attendance_date: string;
  status: string;
}

export const AttendanceChart = () => {
  const { user } = useSession();

  const { data: dailyAttendances, isLoading, error } = useQuery<DailyAttendance[]>({
    queryKey: ["dashboard_attendance_chart", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd"); // Get data for the last 7 days
      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_attendances")
        .select("attendance_date, status")
        .eq("user_id", user.id)
        .gte("attendance_date", sevenDaysAgo)
        .lte("attendance_date", today)
        .order("attendance_date", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user,
  });

  const chartData = React.useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(), 6 - i), "yyyy-MM-dd")
    );

    const aggregated = dates.map((date) => ({
      date: format(new Date(date), "dd MMM", { locale: fr }),
      Present: 0,
      Absent: 0,
      Leave: 0,
      Sick: 0,
      Holiday: 0,
    }));

    dailyAttendances?.forEach((att) => {
      const dateIndex = dates.indexOf(att.attendance_date);
      if (dateIndex !== -1) {
        if (att.status === "Present") aggregated[dateIndex].Present++;
        if (att.status === "Absent") aggregated[dateIndex].Absent++;
        if (att.status === "Leave") aggregated[dateIndex].Leave++;
        if (att.status === "Sick") aggregated[dateIndex].Sick++;
        if (att.status === "Holiday") aggregated[dateIndex].Holiday++;
      }
    });

    return aggregated;
  }, [dailyAttendances]);

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Présence Quotidienne (7 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Chargement du graphique de présence...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    showError("Erreur lors du chargement du graphique de présence: " + error.message);
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Présence Quotidienne (7 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500 h-64 flex items-center justify-center">
          Erreur: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Présence Quotidienne (7 derniers jours)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Present" stackId="a" fill="#82ca9d" name="Présent" />
              <Bar dataKey="Absent" stackId="a" fill="#ffc658" name="Absent" />
              <Bar dataKey="Leave" stackId="a" fill="#8884d8" name="En congé" />
              <Bar dataKey="Sick" stackId="a" fill="#ff7300" name="Maladie" />
              <Bar dataKey="Holiday" stackId="a" fill="#0088FE" name="Férié" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Aucune donnée de présence pour les 7 derniers jours.
          </div>
        )}
      </CardContent>
    </Card>
  );
};