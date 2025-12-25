"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface TeamMember {
  id: string;
  name: string;
}

// Schéma de validation pour le formulaire de demande d'heures supplémentaires
const formSchema = z.object({
  teamMemberId: z.string().min(1, "Veuillez sélectionner un membre d'équipe."),
  date: z.date({
    required_error: "Veuillez sélectionner une date.",
  }),
  hours: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().min(0.5, "Le nombre d'heures doit être au moins de 0.5").max(24, "Le nombre d'heures ne peut pas dépasser 24")
  ),
  description: z.string().max(255, "La description est trop longue.").optional(),
});

type AddOvertimeRequestFormValues = z.infer<typeof formSchema>;

export const AddOvertimeRequestForm = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddOvertimeRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamMemberId: "",
      date: undefined,
      hours: undefined,
      description: "",
    },
  });

  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["team_members_for_overtime"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name")
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
  });

  const onSubmit = async (values: AddOvertimeRequestFormValues) => {
    if (!user) {
      showError("Vous devez être connecté pour soumettre une demande d'heures supplémentaires.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("overtime_requests").insert([
      {
        user_id: user.id,
        team_member_id: values.teamMemberId,
        date: format(values.date, "yyyy-MM-dd"),
        hours: values.hours,
        description: values.description?.trim() || null,
        status: "Pending",
      },
    ]);

    if (error) {
      console.error("Erreur lors de la soumission de la demande d'heures supplémentaires:", error);
      showError("Échec de la soumission de la demande: " + error.message);
    } else {
      showSuccess("Demande d'heures supplémentaires soumise avec succès !");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["overtime_requests"] });
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nouvelle Demande d'Heures Supplémentaires</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="teamMember">Membre de l'équipe</Label>
            <Select
              value={form.watch("teamMemberId")}
              onValueChange={(value) => form.setValue("teamMemberId", value, { shouldValidate: true })}
              disabled={isLoadingTeamMembers || loading}
            >
              <SelectTrigger id="teamMember">
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTeamMembers ? (
                  <SelectItem value="loading" disabled>
                    Chargement...
                  </SelectItem>
                ) : teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-members" disabled>
                    Aucun membre d'équipe disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.teamMemberId && (
              <p className="text-red-500 text-sm">{form.formState.errors.teamMemberId.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("date") && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("date") ? format(form.watch("date")!, "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("date")}
                  onSelect={(date) => form.setValue("date", date!, { shouldValidate: true })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.date && (
              <p className="text-red-500 text-sm">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hours">Nombre d'heures</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              placeholder="Ex: 8.5"
              {...form.register("hours", { valueAsNumber: true })}
              disabled={loading}
            />
            {form.formState.errors.hours && (
              <p className="text-red-500 text-sm">{form.formState.errors.hours.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Travail sur le projet X en urgence."
              {...form.register("description")}
              disabled={loading}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Soumission en cours...
              </>
            ) : (
              "Soumettre la demande"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};