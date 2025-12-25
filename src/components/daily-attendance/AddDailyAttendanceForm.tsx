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

// Schéma de validation pour le formulaire d'enregistrement de présence quotidienne
const formSchema = z.object({
  teamMemberId: z.string().min(1, "Veuillez sélectionner un membre d'équipe."),
  attendanceDate: z.date({
    required_error: "Veuillez sélectionner une date de présence.",
  }),
  status: z.enum(["Present", "Absent", "Leave", "Sick", "Holiday"], {
    required_error: "Veuillez sélectionner un statut.",
  }),
  hoursWorked: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.nullable(z.number().min(0.5, "Les heures travaillées doivent être au moins de 0.5").max(24, "Les heures travaillées ne peuvent pas dépasser 24")).optional()
  ),
  description: z.string().max(255, "La description est trop longue.").optional(),
}).superRefine((data, ctx) => {
  if (data.status === "Present" && data.hoursWorked === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Veuillez entrer les heures travaillées pour le statut 'Présent'.",
      path: ["hoursWorked"],
    });
  }
});

type AddDailyAttendanceFormValues = z.infer<typeof formSchema>;

export const AddDailyAttendanceForm = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<AddDailyAttendanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamMemberId: "",
      attendanceDate: undefined,
      status: "Present",
      hoursWorked: undefined,
      description: "",
    },
  });

  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["team_members_for_attendance"],
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

  const onSubmit = async (values: AddDailyAttendanceFormValues) => {
    if (!user) {
      showError("Vous devez être connecté pour enregistrer une présence.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("daily_attendances").insert([
      {
        user_id: user.id,
        team_member_id: values.teamMemberId,
        attendance_date: format(values.attendanceDate, "yyyy-MM-dd"),
        status: values.status,
        hours_worked: values.status === "Present" ? values.hoursWorked : null,
        description: values.description?.trim() || null,
      },
    ]);

    if (error) {
      console.error("Erreur lors de l'enregistrement de la présence:", error);
      showError("Échec de l'enregistrement de la présence: " + error.message);
    } else {
      showSuccess("Présence enregistrée avec succès !");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["daily_attendances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_attendance_chart"] }); // Invalider le graphique du tableau de bord
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Enregistrer une Présence Quotidienne</CardTitle>
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
            <Label htmlFor="attendanceDate">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("attendanceDate") && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("attendanceDate") ? format(form.watch("attendanceDate")!, "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("attendanceDate")}
                  onSelect={(date) => form.setValue("attendanceDate", date!, { shouldValidate: true })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.attendanceDate && (
              <p className="text-red-500 text-sm">{form.formState.errors.attendanceDate.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value: "Present" | "Absent" | "Leave" | "Sick" | "Holiday") => form.setValue("status", value, { shouldValidate: true })}
              disabled={loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Présent</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Leave">En congé</SelectItem>
                <SelectItem value="Sick">Maladie</SelectItem>
                <SelectItem value="Holiday">Férié</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>
            )}
          </div>

          {form.watch("status") === "Present" && (
            <div className="grid gap-2">
              <Label htmlFor="hoursWorked">Heures travaillées</Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                placeholder="Ex: 8.00"
                {...form.register("hoursWorked")}
                disabled={loading}
              />
              {form.formState.errors.hoursWorked && (
                <p className="text-red-500 text-sm">{form.formState.errors.hoursWorked.message}</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Journée de travail normale, absence justifiée..."
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
                Enregistrement en cours...
              </>
            ) : (
              "Enregistrer la présence"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};