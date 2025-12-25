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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

// Schéma de validation pour le formulaire d'ajout de membre d'équipe
const formSchema = z.object({
  name: z.string().min(1, "Le nom du membre est requis.").max(100, "Le nom est trop long."),
});

type AddTeamMemberFormValues = z.infer<typeof formSchema>;

export const AddTeamMemberForm = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddTeamMemberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: AddTeamMemberFormValues) => {
    if (!user) {
      showError("Vous devez être connecté pour ajouter un membre d'équipe.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("team_members")
      .insert([{ name: values.name.trim(), user_id: user.id }])
      .select();

    if (error) {
      console.error("Erreur lors de l'ajout du membre de l'équipe:", error);
      showError("Échec de l'ajout du membre de l'équipe: " + error.message);
    } else {
      showSuccess("Membre de l'équipe ajouté avec succès !");
      form.reset(); // Réinitialiser le formulaire après succès
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ajouter un nouveau membre</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom du membre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Jean Dupont"
              {...form.register("name")} // Enregistrer l'input avec react-hook-form
              disabled={loading}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              "Ajouter le membre"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};