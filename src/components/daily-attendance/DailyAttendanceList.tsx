"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showSuccess, showError } from "@/utils/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DailyAttendance {
  id: string;
  team_member_id: string;
  team_members: { name: string };
  attendance_date: string;
  status: string;
  hours_worked: number | null;
  clock_in_time: string | null; // New field
  clock_out_time: string | null; // New field
  description: string | null;
  created_at: string;
}

export const DailyAttendanceList = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: dailyAttendances, isLoading, error } = useQuery<DailyAttendance[]>({
    queryKey: ["daily_attendances", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_attendances")
        .select("*, team_members(name)")
        .eq("user_id", user.id)
        .order("attendance_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer un enregistrement.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement de présence ?")) {
      return;
    }

    const { error } = await supabase
      .from("daily_attendances")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la suppression de l'enregistrement:", error);
      showError("Échec de la suppression de l'enregistrement: " + error.message);
    } else {
      showSuccess("Enregistrement de présence supprimé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["daily_attendances", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_attendance_chart", user?.id] });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier le statut.");
      return;
    }

    const { error } = await supabase
      .from("daily_attendances")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showError("Échec de la mise à jour du statut: " + error.message);
    } else {
      showSuccess("Statut mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["daily_attendances", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_attendance_chart", user?.id] });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Historique des Présences Quotidiennes</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Chargement des présences...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Historique des Présences Quotidiennes</CardTitle>
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
        <CardTitle>Historique des Présences Quotidiennes</CardTitle>
      </CardHeader>
      <CardContent>
        {dailyAttendances && dailyAttendances.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Heure d'entrée</TableHead>
                <TableHead>Heure de sortie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyAttendances.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell className="font-medium">{attendance.team_members.name}</TableCell>
                  <TableCell>{format(new Date(attendance.attendance_date), "PPP", { locale: fr })}</TableCell>
                  <TableCell>{attendance.clock_in_time || "N/A"}</TableCell>
                  <TableCell>{attendance.clock_out_time || "N/A"}</TableCell>
                  <TableCell>
                    <Select
                      value={attendance.status}
                      onValueChange={(newStatus) => handleStatusChange(attendance.id, newStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Présent</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                        <SelectItem value="Leave">En congé</SelectItem>
                        <SelectItem value="Sick">Maladie</SelectItem>
                        <SelectItem value="Holiday">Férié</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{attendance.hours_worked !== null ? attendance.hours_worked : "N/A"}</TableCell>
                  <TableCell>{attendance.description || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(attendance.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">Aucun enregistrement de présence quotidienne pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
};