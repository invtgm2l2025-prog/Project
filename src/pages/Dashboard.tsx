"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { Loader2 } from "lucide-react";
import { showError } from "@/utils/toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale"; // Import French locale for date formatting

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

const Dashboard = () => {
  const { user } = useSession();

  // Fetch team members count and status
  const { data: teamMembersData, isLoading: isLoadingTeamMembers, error: teamMembersError } = useQuery({
    queryKey: ["dashboard_team_members"],
    queryFn: async () => {
      if (!user) return { total: 0, present: 0 };
      const { data, error } = await supabase
        .from("team_members")
        .select("id, status")
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      const total = data?.length || 0;
      const present = data?.filter(member => member.status === "Présent").length || 0;
      return { total, present };
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

  // Fetch recent activities
  const { data: recentLeaveRequests, isLoading: isLoadingRecentLeaveRequests } = useQuery({
    queryKey: ["recent_leave_requests"],
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
        type: "leave_request",
        message: `Nouvelle demande de congé de ${req.team_members?.name || 'un membre'} du ${format(new Date(req.start_date), "PPP", { locale: fr })} au ${format(new Date(req.end_date), "PPP", { locale: fr })} (Statut: ${req.status}).`,
      }));
    },
    enabled: !!user,
  });

  const { data: recentOvertimeRequests, isLoading: isLoadingRecentOvertimeRequests } = useQuery({
    queryKey: ["recent_overtime_requests"],
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
        type: "overtime_request",
        message: `Nouvelle demande d'heures supplémentaires de ${req.team_members?.name || 'un membre'} pour ${req.hours} heures le ${format(new Date(req.date), "PPP", { locale: fr })} (Statut: ${req.status}).`,
      }));
    },
    enabled: !!user,
  });

  const { data: recentTours, isLoading: isLoadingRecentTours } = useQuery({
    queryKey: ["recent_tours"],
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
        type: "tour_planned",
        message: `Nouvelle tournée planifiée pour ${tour.team_members?.name || 'un membre'} le ${format(new Date(tour.tour_date), "PPP", { locale: fr })} (Statut: ${tour.status}).`,
      }));
    },
    enabled: !!user,
  });

  const { data: recentTeamMembers, isLoading: isLoadingRecentTeamMembers } = useQuery({
    queryKey: ["recent_team_members"],
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
        type: "team_member_added",
        message: `Nouveau membre d'équipe ajouté : ${member.name}.`,
      }));
    },
    enabled: !!user,
  });

  const allRecentActivities = [
    ...(recentLeaveRequests || []),
    ...(recentOvertimeRequests || []),
    ...(recentTours || []),
    ...(recentTeamMembers || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (teamMembersError) showError("Erreur lors du chargement des membres de l'équipe: " + teamMembersError.message);
  if (leaveRequestsError) showError("Erreur lors du chargement des demandes de congés: " + leaveRequestsError.message);
  if (overtimeError) showError("Erreur lors du chargement des heures supplémentaires: " + overtimeError.message);
  if (toursError) showError("Erreur lors du chargement des tournées: " + toursError.message);

  const isLoadingAny = isLoadingTeamMembers || isLoadingLeaveRequests || isLoadingOvertime || isLoadingTours ||
                       isLoadingRecentLeaveRequests || isLoadingRecentOvertimeRequests || isLoadingRecentTours || isLoadingRecentTeamMembers;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Présence Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAny ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-2xl font-semibold">{teamMembersData?.present}/{teamMembersData?.total} membres présents</p>
                <p className="text-sm text-muted-foreground">Statut actuel de l'équipe</p>
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
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Activités Récentes</h2>
        <Card>
          <CardContent className="p-4">
            {isLoadingAny ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Chargement des activités...</p>
              </div>
            ) : allRecentActivities && allRecentActivities.length > 0 ? (
              <ul className="space-y-2">
                {allRecentActivities.slice(0, 5).map((activity, index) => ( // Display up to 5 recent activities
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{format(new Date(activity.created_at), "dd/MM HH:mm", { locale: fr })}:</span> {activity.message}
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
      </div>
    </div>
  );
};

export default Dashboard;