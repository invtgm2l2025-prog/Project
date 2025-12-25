"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DailyAttendance {
  id: string;
  attendance_date: string;
  status: string;
  hours_worked: number | null;
  description: string | null;
  created_at: string;
}

interface TeamMemberAttendanceListProps {
  teamMemberId: string;
}

export const TeamMemberAttendanceList = ({ teamMemberId }: TeamMemberAttendanceListProps) => {
  const { user } = useSession();

  const { data: dailyAttendances, isLoading, error } = useQuery<DailyAttendance[]>({
    queryKey: ["team_member_daily_attendances", teamMemberId],
    queryFn: async () => {
      if (!user || !teamMemberId) return [];
      const { data, error } = await supabase
        .from("daily_attendances")
        .select("*")
        .eq("user_id", user.id)
        .eq("team_member_id", teamMemberId)
        .order("attendance_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user && !!teamMemberId,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Présences Quotidiennes</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Chargement des présences...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    showError("Erreur lors du chargement des présences: " + error.message);
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Présences Quotidiennes</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erreur lors du chargement des présences: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Présences Quotidiennes</CardTitle>
      </CardHeader>
      <CardContent>
        {dailyAttendances && dailyAttendances.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Heures</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyAttendances.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>{format(new Date(attendance.attendance_date), "PPP", { locale: fr })}</TableCell>
                    <TableCell>{attendance.status}</TableCell>
                    <TableCell>{attendance.hours_worked !== null ? attendance.hours_worked : "N/A"}</TableCell>
                    <TableCell>{attendance.description || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun enregistrement de présence quotidienne pour ce membre.</p>
        )}
      </CardContent>
    </Card>
  );
};