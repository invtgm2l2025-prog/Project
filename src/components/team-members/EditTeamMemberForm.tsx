"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface EditTeamMemberFormProps {
  teamMember: TeamMember;
  onUpdateSuccess?: () => void;
}

export const EditTeamMemberForm = ({ teamMember, onUpdateSuccess }: EditTeamMemberFormProps) => {
  const [name, setName] = useState(teamMember.name);
  const [status, setStatus] = useState(teamMember.status);
  const queryClient = useQueryClient();
  const { user } = useSession();

  useEffect(() => {
    setName(teamMember.name);
    setStatus(teamMember.status);
  }, [teamMember]);

  const updateTeamMemberMutation = useMutation({
    mutationFn: async (updatedFields: { name?: string; status?: string }) => {
      if (!user) throw new Error("Vous devez être connecté pour modifier un membre d'équipe.");
      const { error } = await supabase
        .from("team_members")
        .update(updatedFields)
        .eq("id", teamMember.id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_member_details", teamMember.id] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] }); // Invalider la liste générale aussi
      showSuccess("Membre de l'équipe mis à jour avec succès !");
      onUpdateSuccess?.();
    },
    onError: (error: Error) => {
      showError("Échec de la mise à jour du membre de l'équipe: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError("Le nom du membre de l'équipe ne peut pas être vide.");
      return;
    }
    updateTeamMemberMutation.mutate({ name: name.trim(), status });
  };

  const isLoading = updateTeamMemberMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Modifier le Membre de l'Équipe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom du membre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nom du membre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Présent">Présent</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="En congé">En congé</SelectItem>
                <SelectItem value="En mission">En mission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              "Mettre à jour le membre"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};