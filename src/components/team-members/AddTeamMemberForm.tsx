"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/components/auth/SessionContextProvider";

export const AddTeamMemberForm = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError("Vous devez être connecté pour ajouter un membre d'équipe.");
      return;
    }
    if (!name.trim()) {
      showError("Le nom du membre de l'équipe ne peut pas être vide.");
      return;
    }

    setLoading(true);
    const { error } = await supabase // 'data' variable removed as it was not used
      .from("team_members")
      .insert([{ name: name.trim(), user_id: user.id }])
      .select();

    if (error) {
      console.error("Erreur lors de l'ajout du membre de l'équipe:", error);
      showError("Échec de l'ajout du membre de l'équipe: " + error.message);
    } else {
      showSuccess("Membre de l'équipe ajouté avec succès !");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["team_members"] }); // Invalider le cache pour rafraîchir la liste
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ajouter un nouveau membre</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom du membre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ajout en cours..." : "Ajouter le membre"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};