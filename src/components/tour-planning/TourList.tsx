"use client";

import React from "react";
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

interface Tour {
  id: string;
  team_member_id: string;
  team_members: { name: string }; // Join with team_members table
  tour_date: string;
  description: string | null;
  status: string;
  created_at: string;
}

export const TourList = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: tours, isLoading, error } = useQuery<Tour[]>({
    queryKey: ["tours"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tours")
        .select("*, team_members(name)")
        .eq("user_id", user.id)
        .order("tour_date", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer une tournée.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tournée ?")) {
      return;
    }

    const { error } = await supabase
      .from("tours")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la suppression de la tournée:", error);
      showError("Échec de la suppression de la tournée: " + error.message);
    } else {
      showSuccess("Tournée supprimée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier le statut d'une tournée.");
      return;
    }

    const { error } = await supabase
      .from("tours")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut de la tournée:", error);
      showError("Échec de la mise à jour du statut: " + error.message);
    } else {
      showSuccess("Statut de la tournée mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    }
  };

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tours.map((tour) => (
                <TableRow key={tour.id}>
                  <TableCell className="font-medium">{tour.team_members.name}</TableCell>
                  <TableCell>{format(new Date(tour.tour_date), "PPP")}</TableCell>
                  <TableCell>{tour.description || "N/A"}</TableCell>
                  <TableCell>
                    <Select
                      value={tour.status}
                      onValueChange={(newStatus) => handleStatusChange(tour.id, newStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planifiée</SelectItem>
                        <SelectItem value="In Progress">En cours</SelectItem>
                        <SelectItem value="Completed">Terminée</SelectItem>
                        <SelectItem value="Cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(tour.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">Aucune tournée planifiée pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
};