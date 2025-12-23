"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "@/components/auth/SessionContextProvider";

interface TeamMember {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export const TeamMembersList = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: teamMembers, isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ["team_members"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user, // N'exécuter la requête que si l'utilisateur est connecté
  });

  const handleDelete = async (id: string) => {
    if (!user) {
      showError("Vous devez être connecté pour supprimer un membre d'équipe.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce membre de l'équipe ?")) {
      return;
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // S'assurer que l'utilisateur ne peut supprimer que ses propres membres

    if (error) {
      console.error("Erreur lors de la suppression du membre de l'équipe:", error);
      showError("Échec de la suppression du membre de l'équipe: " + error.message);
    } else {
      showSuccess("Membre de l'équipe supprimé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["team_members"] }); // Invalider le cache pour rafraîchir la liste
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Membres de l'équipe</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Chargement des membres de l'équipe...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Membres de l'équipe</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erreur lors du chargement des membres de l'équipe: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Membres de l'équipe</CardTitle>
      </CardHeader>
      <CardContent>
        {teamMembers && teamMembers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.status}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">Aucun membre d'équipe ajouté pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
};