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

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

interface TeamMemberLeaveRequestsListProps {
  teamMemberId: string;
}

export const TeamMemberLeaveRequestsList = ({ teamMemberId }: TeamMemberLeaveRequestsListProps) => {
  const { user } = useSession();

  const { data: leaveRequests, isLoading, error } = useQuery<LeaveRequest[]>({
    queryKey: ["team_member_leave_requests", teamMemberId],
    queryFn: async () => {
      if (!user || !teamMemberId) return [];
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("team_member_id", teamMemberId)
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
          <CardTitle>Demandes de Congés</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Chargement des demandes de congés...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    showError("Erreur lors du chargement des demandes de congés: " + error.message);
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Demandes de Congés</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erreur lors du chargement des demandes de congés: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Demandes de Congés</CardTitle>
      </CardHeader>
      <CardContent>
        {leaveRequests && leaveRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{format(new Date(request.start_date), "PPP", { locale: fr })}</TableCell>
                    <TableCell>{format(new Date(request.end_date), "PPP", { locale: fr })}</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>{request.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune demande de congé pour ce membre.</p>
        )}
      </CardContent>
    </Card>
  );
};