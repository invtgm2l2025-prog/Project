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

interface OvertimeRequest {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  status: string;
  created_at: string;
}

interface TeamMemberOvertimeRequestsListProps {
  teamMemberId: string;
}

export const TeamMemberOvertimeRequestsList = ({ teamMemberId }: TeamMemberOvertimeRequestsListProps) => {
  const { user } = useSession();

  const { data: overtimeRequests, isLoading, error } = useQuery<OvertimeRequest[]>({
    queryKey: ["team_member_overtime_requests", teamMemberId],
    queryFn: async () => {
      if (!user || !teamMemberId) return [];
      const { data, error } = await supabase
        .from("overtime_requests")
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
          <CardTitle>Demandes d'Heures Supplémentaires</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Chargement des demandes d'heures supplémentaires...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    showError("Erreur lors du chargement des demandes d'heures supplémentaires: " + error.message);
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Demandes d'Heures Supplémentaires</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erreur lors du chargement des demandes d'heures supplémentaires: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Demandes d'Heures Supplémentaires</CardTitle>
      </CardHeader>
      <CardContent>
        {overtimeRequests && overtimeRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Heures</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overtimeRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{format(new Date(request.date), "PPP", { locale: fr })}</TableCell>
                    <TableCell>{request.hours}</TableCell>
                    <TableCell>{request.description || "N/A"}</TableCell>
                    <TableCell>{request.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune demande d'heures supplémentaires pour ce membre.</p>
        )}
      </CardContent>
    </Card>
  );
};