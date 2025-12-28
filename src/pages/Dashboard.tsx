"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { Loader2 } from "lucide-react";
import { showError } from "@/utils/toast";
import { format, subDays } from "date-fns";
// Removed: import { fr } from "date-fns/locale";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { RecentActivitiesList } from "@/components/dashboard/RecentActivitiesList"; // Import the new component

// Removed: interface SupabaseJoinedTeamMember
// Removed: interface SupabaseLeaveRequestData
// Removed: interface SupabaseOvertimeRequestData
// Removed: interface SupabaseTourData
// Removed: interface SupabaseTeamMemberData

interface DailyAttendanceForStats {
  attendance_date: string;
  team_member_id: string;
  status: string;
}

const Dashboard = () => {
  const { user } = useSession();

  // Fetch total team members count
  const { data: totalTeamMembersCount, isLoading: isLoadingTotalTeamMembers, error: totalTeamMembersError } = useQuery({
    queryKey: ["dashboard_total_team_members", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("team_members")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch present team members count today
  const { data: presentTeamMembersToday, isLoading: isLoadingPresentTeamMembersToday, error: presentTeamMembersTodayError } = useQuery({
    queryKey: ["dashboard_present_team_members_today", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const today = format(new Date(), "yyyy-MM-dd");
      const { count, error } = await supabase
        .from("daily_attendances")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("attendance_date", today)
        .eq("status", "Present");
      if (error) throw new Error(error.message);
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch pending leave requests count
  const { data: leaveRequestsCount, isLoading: isLoadingLeaveRequests, error: leaveRequestsError } = useQuery({
    queryKey: ["dashboard_leave_requests_count"],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("leave_requests")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("status", "Pending");

      if (error) throw new Error(error.message);
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch total overtime hours for the week (simplified for dashboard)
  const { data: overtimeHours, isLoading: isLoadingOvertime, error: overtimeError } = useQuery({
    queryKey: ["dashboard_overtime_hours"],
    queryFn: async () => {
      if (!user) return 0;
      // For simplicity, fetching all approved overtime and summing.
      // In a real app, you'd filter by week/month.
      const { data, error } = await supabase
        .from("overtime_requests")
        .select("hours")
        .eq("user_id", user.id)
        .eq("status", "Approved");

      if (error) throw new Error(error.message);
      return data?.reduce((sum, request) => sum + request.hours, 0) || 0;
    },
    enabled: !!user,
  });

  // Fetch planned tours count
  const { data: plannedToursCount, isLoading: isLoadingTours, error: toursError } = useQuery({
    queryKey: ["dashboard_planned_tours_count"],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("tours")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .eq("status", "Planned");

      if (error) throw new Error(error.message);
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch daily attendance stats for average present members
  const { data: dailyAttendanceStats, isLoading: isLoadingDailyAttendanceStats, error: dailyAttendanceStatsError } = useQuery({
    queryKey: ["dashboard_daily_attendance_stats", user?.id],
    queryFn: async () => {
      if (!user) return { averagePresentUnique: 0 };

      const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("daily_attendances")
        .select("attendance_date, team_member_id, status")
        .eq("user_id", user.id)
        .gte("attendance_date", sevenDaysAgo)
        .lte("attendance_date", today);

      if (error) throw new Error(error.message);

      const dailyUniquePresent: { [date: string]: Set<string> } = {};
      (data as DailyAttendanceForStats[])?.forEach(att => {
        if (att.status === "Present") {
          if (!dailyUniquePresent[att.attendance_date]) {
            dailyUniquePresent[att.attendance_date] = new Set();
          }
          dailyUniquePresent[att.attendance_date].add(att.team_member_id);
        }
      });

      let totalUniquePresentCount = 0;
      let daysCounted = 0;
      for (const date in dailyUniquePresent) {
        totalUniquePresentCount += dailyUniquePresent[date].size;
        daysCounted++;
      }

      const averagePresentUnique = daysCounted > 0 ? totalUniquePresentCount / daysCounted : 0;

      return { averagePresentUnique: parseFloat(averagePresentUnique.toFixed(1)) };
    },
    enabled: !!user,
  });

  if (totalTeamMembersError) showError("Erreur lors du chargement du nombre total de membres de l'équipe: " + totalTeamMembersError.message);
  if (presentTeamMembersTodayError) showError("Erreur lors du chargement des membres présents aujourd'hui: " + presentTeamMembersTodayError.message);
  if (leaveRequestsError) showError("Erreur lors du chargement des demandes de congés: " + leaveRequestsError.message);
  if (overtimeError) showError("Erreur lors du chargement des heures supplémentaires: " + overtimeError.message);
  if (toursError) showError("Erreur lors du chargement des tournées: " + toursError.message);
  if (dailyAttendanceStatsError) showError("Erreur lors du chargement des statistiques de présence quotidienne: " + dailyAttendanceStatsError.message);

  const isLoadingAny = isLoadingTotalTeamMembers || isLoadingPresentTeamMembersToday || isLoadingLeaveRequests || isLoadingOvertime || isLoadingTours ||
                       isLoadingDailyAttendanceStats; // Removed recent activities loading states as they are now handled by RecentActivitiesList

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Membres de l'équipe</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-2xl font-semibold">{totalTeamMembersCount} membres</p>
                <p className="text-sm text-muted-foreground">Total de l'équipe</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Présence Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-2xl font-semibold">{presentTeamMembersToday} présents</p>
                <p className="text-sm text-muted-foreground">Membres présents aujourd'hui</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Moyenne Présence Quotidienne</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-2xl font-semibold">{dailyAttendanceStats?.averagePresentUnique} membres</p>
                <p className="text-sm text-muted-foreground">Moyenne sur 7 jours</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Congés en Attente</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-2xl font-semibold">{leaveRequestsCount} demandes</p>
                <p className="text-sm text-muted-foreground">À examiner</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Heures Supplémentaires (Approuvées)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-2xl font-semibold">{overtimeHours} heures</p>
                <p className="text-sm text-muted-foreground">Total de l'équipe</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tournées Planifiées</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-2xl font-semibold">{plannedToursCount} tournées</p>
                <p className="text-sm text-muted-foreground">En attente de réalisation</p>
              </>
            )}
          </CardContent>
        </Card>
        {/* New Attendance Chart */}
        <AttendanceChart />
        {/* Replaced the manual recent activities list with the new component */}
        <RecentActivitiesList />
      </div>
    </div>
  );
};

export default Dashboard;