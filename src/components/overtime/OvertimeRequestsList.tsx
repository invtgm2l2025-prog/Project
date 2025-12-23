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

interface OvertimeRequest {
  id: string;
  team_member_id: string;
  team_members: { name: string }; // Join with team_members table
  date: string;
  hours: number;
  description: string | null;
  status: string;
  created_at: string;
}

export const OvertimeRequestsList = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: overtimeRequests, isLoading, error } = useQuery<OvertimeRequest[]>({
    queryKey: ["overtime_requests"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("overtime_requests")
        .select("*, team_members(name)") // Select all from overtime_requests and the name from team_members
        .eq("user_id", user.id)
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
      showError("Vous devez être connecté pour supprimer une demande d'heures supplémentaires.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande d'heures supplémentaires ?")) {
      return;
    }

    const { error } = await supabase
      .from("overtime_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la suppression de la demande d'heures supplémentaires:", error);
      showError("Échec de la suppression de la demande: " + error.message);
    } else {
      showSuccess("Demande d'heures supplémentaires supprimée avec succès !");
      queryClient.invalidateQueries({ queryKey: ["overtime_requests"] });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier le statut d'une demande d'heures supplémentaires.");
      return;
    }

    const { error } = await supabase
      .from("overtime_requests")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showError("Échec de la mise à jour du statut: " + error.message);
    } else {
      showSuccess("Statut de la demande mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["overtime_requests"] });
    }
  };

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overtimeRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.team_members.name}</TableCell>
                  <TableCell>{format(new Date(request.date), "PPP")}</TableCell>
                  <TableCell>{request.hours}</TableCell>
                  <TableCell>{request.description || "N/A"}</TableCell>
                  <TableCell>
                    <Select
                      value={request.status}
                      onValueChange={(newStatus) => handleStatusChange(request.id, newStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">En attente</SelectItem>
                        <SelectItem value="Approved">Approuvé</SelectItem>
                        <SelectItem value="Rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(request.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">Aucune demande d'heures supplémentaires soumise pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
};