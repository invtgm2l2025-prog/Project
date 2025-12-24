"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { Loader2 } from "lucide-react";
import { showError } from "@/utils/toast";

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

  if (teamMembersError) showError("Erreur lors du chargement des membres de l'équipe: " + teamMembersError.message);
  if (leaveRequestsError) showError("Erreur lors du chargement des demandes de congés: " + leaveRequestsError.message);
  if (overtimeError) showError("Erreur lors du chargement des heures supplémentaires: " + overtimeError.message);
  if (toursError) showError("Erreur lors du chargement des tournées: " + toursError.message);

  const isLoadingAny = isLoadingTeamMembers || isLoadingLeaveRequests || isLoadingOvertime || isLoadingTours;

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
            <p className="text-muted-foreground">
              Les activités récentes seront affichées ici (fonctionnalité à venir).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;