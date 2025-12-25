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

interface Tour {
  id: string;
  tour_date: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface TeamMemberTourListProps {
  teamMemberId: string;
}

export const TeamMemberTourList = ({ teamMemberId }: TeamMemberTourListProps) => {
  const { user } = useSession();

  const { data: tours, isLoading, error } = useQuery<Tour[]>({
    queryKey: ["team_member_tours", teamMemberId],
    queryFn: async () => {
      if (!user || !teamMemberId) return [];
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("user_id", user.id)
        .eq("team_member_id", teamMemberId)
        .order("tour_date", { ascending: false });

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
          <CardTitle>Tournées Planifiées</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Chargement des tournées...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    showError("Erreur lors du chargement des tournées: " + error.message);
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tournées Planifiées</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erreur lors du chargement des tournées: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tournées Planifiées</CardTitle>
      </CardHeader>
      <CardContent>
        {tours && tours.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell>{format(new Date(tour.tour_date), "PPP", { locale: fr })}</TableCell>
                    <TableCell>{tour.description || "N/A"}</TableCell>
                    <TableCell>{tour.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune tournée planifiée pour ce membre.</p>
        )}
      </CardContent>
    </Card>
  );
};