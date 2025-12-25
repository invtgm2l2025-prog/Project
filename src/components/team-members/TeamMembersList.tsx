"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input"; // Import Input component
import { Loader2, Trash2, Search } from "lucide-react"; // Import Search icon
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "@/components/auth/SessionContextProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

interface TeamMember {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export const TeamMembersList = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  const { data: teamMembers, isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ["team_members", searchTerm], // Add searchTerm to queryKey for re-fetching
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id);

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`); // Case-insensitive search
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!user,
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
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la suppression du membre de l'équipe:", error);
      showError("Échec de la suppression du membre de l'équipe: " + error.message);
    } else {
      showSuccess("Membre de l'équipe supprimé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user) {
      showError("Vous devez être connecté pour modifier le statut d'un membre d'équipe.");
      return;
    }

    const { error } = await supabase
      .from("team_members")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showError("Échec de la mise à jour du statut: " + error.message);
    } else {
      showSuccess("Statut mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un membre par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
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
                  <TableCell className="font-medium">
                    <Link to={`/team-members/${member.id}`} className="text-blue-600 hover:underline">
                      {member.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.status}
                      onValueChange={(newStatus) => handleStatusChange(member.id, newStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Présent">Présent</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                        <SelectItem value="En congé">En congé</SelectItem>
                        <SelectItem value="En mission">En mission</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
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
          <p className="text-muted-foreground">Aucun membre d'équipe trouvé.</p>
        )}
      </CardContent>
    </Card>
  );
};