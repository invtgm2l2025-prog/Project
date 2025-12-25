"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
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

// Schéma de validation pour le formulaire de demande de congé
const formSchema = z.object({
  teamMemberId: z.string().min(1, "Veuillez sélectionner un membre d'équipe."),
  startDate: z.date({
    required_error: "Veuillez sélectionner une date de début.",
  }),
  endDate: z.date({
    required_error: "Veuillez sélectionner une date de fin.",
  }),
  reason: z.string().min(1, "La raison du congé est requise.").max(255, "La raison est trop longue."),
}).superRefine((data, ctx) => {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La date de début ne peut pas être postérieure à la date de fin.",
      path: ["startDate"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La date de fin ne peut pas être antérieure à la date de début.",
      path: ["endDate"],
    });
  }
});

type AddLeaveRequestFormValues = z.infer<typeof formSchema>;

export const AddLeaveRequestForm = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddLeaveRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamMemberId: "",
      startDate: undefined,
      endDate: undefined,
      reason: "",
    },
  });

  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["team_members_for_leave"],
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

  const onSubmit = async (values: AddLeaveRequestFormValues) => {
    if (!user) {
      showError("Vous devez être connecté pour soumettre une demande de congé.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("leave_requests").insert([
      {
        user_id: user.id,
        team_member_id: values.teamMemberId,
        start_date: format(values.startDate, "yyyy-MM-dd"),
        end_date: format(values.endDate, "yyyy-MM-dd"),
        reason: values.reason.trim(),
        status: "Pending",
      },
    ]);

    if (error) {
      console.error("Erreur lors de la soumission de la demande de congé:", error);
      showError("Échec de la soumission de la demande de congé: " + error.message);
    } else {
      showSuccess("Demande de congé soumise avec succès !");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["leave_requests"] });
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nouvelle Demande de Congé</CardTitle>
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
            <Label htmlFor="startDate">Date de début</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("startDate") && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("startDate") ? format(form.watch("startDate")!, "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("startDate")}
                  onSelect={(date) => form.setValue("startDate", date!, { shouldValidate: true })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.startDate && (
              <p className="text-red-500 text-sm">{form.formState.errors.startDate.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("endDate") && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("endDate") ? format(form.watch("endDate")!, "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("endDate")}
                  onSelect={(date) => form.setValue("endDate", date!, { shouldValidate: true })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.endDate && (
              <p className="text-red-500 text-sm">{form.formState.errors.endDate.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Raison du congé</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Vacances annuelles, rendez-vous médical..."
              {...form.register("reason")}
              disabled={loading}
            />
            {form.formState.errors.reason && (
              <p className="text-red-500 text-sm">{form.formState.errors.reason.message}</p>
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