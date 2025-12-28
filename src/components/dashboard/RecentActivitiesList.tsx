"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarDays, Hourglass, Map, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Define interfaces for the raw data returned by Supabase joins
interface SupabaseJoinedTeamMember {
  name: string;
}

interface SupabaseLeaveRequestData {
  id: string;
  team_members: SupabaseJoinedTeamMember | null;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

interface SupabaseOvertimeRequestData {
  id: string;
  team_members: SupabaseJoinedTeamMember | null;
  date: string;
  hours: number;
  description: string | null;
  status: string;
  created_at: string;
}

interface SupabaseTourData {
  id: string;
  team_members: SupabaseJoinedTeamMember | null;
  tour_date: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface SupabaseTeamMemberData {
  id: string;
  name: string;
  created_at: string;
}

type Activity = {
  id: string;
  type: "leave_request" | "overtime_request" | "tour_planned" | "team_member_added" | "daily_attendance";
  message: string;
  created_at: string;
  icon: React.ElementType;
};

export const RecentActivitiesList = () => {
  const { user } = useSession();

  // Fetch recent leave requests
  const { data: recentLeaveRequests, isLoading: isLoadingRecentLeaveRequests, error: leaveRequestsError } = useQuery({
    queryKey: ["recent_leave_requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("leave_requests")
        .select("id, team_members(name), start_date, end_date, reason, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return (data as unknown as SupabaseLeaveRequestData[]).map(req => ({
        ...req,
        type: "leave_request" as const, // Explicitly cast to literal type
        message: `Nouvelle demande de congé de ${req.team_members?.name || 'un membre'} du ${format(new Date(req.start_date), "PPP", { locale: fr })} au ${format(new Date(req.end_date), "PPP", { locale: fr })} (Statut: ${req.status}).`,
        icon: CalendarDays,
      }));
    },
    enabled: !!user,
  });

  // Fetch recent overtime requests
  const { data: recentOvertimeRequests, isLoading: isLoadingRecentOvertimeRequests, error: overtimeRequestsError } = useQuery({
    queryKey: ["recent_overtime_requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("overtime_requests")
        .select("id, team_members(name), date, hours, description, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return (data as unknown as SupabaseOvertimeRequestData[]).map(req => ({
        ...req,
        type: "overtime_request" as const, // Explicitly cast to literal type
        message: `Nouvelle demande d'heures supplémentaires de ${req.team_members?.name || 'un membre'} pour ${req.hours} heures le ${format(new Date(req.date), "PPP", { locale: fr })} (Statut: ${req.status}).`,
        icon: Hourglass,
      }));
    },
    enabled: !!user,
  });

  // Fetch recent tours
  const { data: recentTours, isLoading: isLoadingRecentTours, error: toursError } = useQuery({
    queryKey: ["recent_tours", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tours")
        .select("id, team_members(name), tour_date, description, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return (data as unknown as SupabaseTourData[]).map(tour => ({
        ...tour,
        type: "tour_planned" as const, // Explicitly cast to literal type
        message: `Nouvelle tournée planifiée pour ${tour.team_members?.name || 'un membre'} le ${format(new Date(tour.tour_date), "PPP", { locale: fr })} (Statut: ${tour.status}).`,
        icon: Map,
      }));
    },
    enabled: !!user,
  });

  // Fetch recent team members
  const { data: recentTeamMembers, isLoading: isLoadingRecentTeamMembers, error: teamMembersError } = useQuery({
    queryKey: ["recent_team_members", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return (data as SupabaseTeamMemberData[]).map(member => ({
        ...member,
        type: "team_member_added" as const, // Explicitly cast to literal type
        message: `Nouveau membre d'équipe ajouté : ${member.name}.`,
        icon: User,
      }));
    },
    enabled: !!user,
  });

  // Fetch recent daily attendances
  const { data: recentDailyAttendances, isLoading: isLoadingRecentDailyAttendances, error: dailyAttendancesError } = useQuery({
    queryKey: ["recent_daily_attendances", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_attendances")
        .select("id, team_members(name), attendance_date, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return (data as unknown as (SupabaseLeaveRequestData & { team_members: SupabaseJoinedTeamMember | null; attendance_date: string; status: string; })[]).map(att => ({
        ...att,
        type: "daily_attendance" as const, // Explicitly cast to literal type
        message: `Présence enregistrée pour ${att.team_members?.name || 'un membre'} le ${format(new Date(att.attendance_date), "PPP", { locale: fr })} (Statut: ${att.status}).`,
        icon: Clock,
      }));
    },
    enabled: !!user,
  });

  const allRecentActivities = React.useMemo(() => {
    const combined: Activity[] = [
      ...(recentLeaveRequests || []),
      ...(recentOvertimeRequests || []),
      ...(recentTours || []),
      ...(recentTeamMembers || []),
      ...(recentDailyAttendances || []),
    ];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [recentLeaveRequests, recentOvertimeRequests, recentTours, recentTeamMembers, recentDailyAttendances]);

  if (leaveRequestsError) showError("Erreur lors du chargement des demandes de congés récentes: " + leaveRequestsError.message);
  if (overtimeRequestsError) showError("Erreur lors du chargement des demandes d'heures supplémentaires récentes: " + overtimeRequestsError.message);
  if (toursError) showError("Erreur lors du chargement des tournées récentes: " + toursError.message);
  if (teamMembersError) showError("Erreur lors du chargement des nouveaux membres d'équipe: " + teamMembersError.message);
  if (dailyAttendancesError) showError("Erreur lors du chargement des présences quotidiennes récentes: " + dailyAttendancesError.message);

  const isLoadingAny = isLoadingRecentLeaveRequests || isLoadingRecentOvertimeRequests || isLoadingRecentTours || isLoadingRecentTeamMembers || isLoadingRecentDailyAttendances;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Activités Récentes</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoadingAny ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Chargement des activités...</p>
          </div>
        ) : allRecentActivities && allRecentActivities.length > 0 ? (
          <ul className="space-y-3">
            {allRecentActivities.slice(0, 7).map((activity, index) => ( // Display up to 7 recent activities
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <activity.icon className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <span className="font-medium">{format(new Date(activity.created_at), "dd/MM HH:mm", { locale: fr })}:</span> {activity.message}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            Aucune activité récente à afficher pour le moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
};