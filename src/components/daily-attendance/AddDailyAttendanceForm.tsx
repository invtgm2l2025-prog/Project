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
import { format, differenceInMinutes, parse } from "date-fns";
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
  clockInTime: z.string().optional(), // Format HH:mm
  clockOutTime: z.string().optional(), // Format HH:mm
  description: z.string().max(255, "La description est trop longue.").optional(),
}).superRefine((data, ctx) => {
  if (data.status === "Present") {
    if (!data.clockInTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'heure d'entrée est requise pour le statut 'Présent'.",
        path: ["clockInTime"],
      });
    }
    if (!data.clockOutTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'heure de sortie est requise pour le statut 'Présent'.",
        path: ["clockOutTime"],
      });
    }
    if (data.clockInTime && data.clockOutTime) {
      const inTime = parse(data.clockInTime, "HH:mm", new Date());
      const outTime = parse(data.clockOutTime, "HH:mm", new Date());
      if (outTime <= inTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'heure de sortie doit être postérieure à l'heure d'entrée.",
          path: ["clockOutTime"],
        });
      }
    }
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
      clockInTime: "",
      clockOutTime: "",
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

  const calculateHoursWorked = (clockIn: string, clockOut: string): number => {
    const inTime = parse(clockIn, "HH:mm", new Date());
    const outTime = parse(clockOut, "HH:mm", new Date());

    const totalMinutes = differenceInMinutes(outTime, inTime);
    let hours = totalMinutes / 60;

    // Apply 1 hour break if total duration is more than 4 hours
    if (hours > 4) {
      hours -= 1;
    }
    return Math.max(0, parseFloat(hours.toFixed(1))); // Ensure hours are not negative and one decimal place
  };

  const onSubmit = async (values: AddDailyAttendanceFormValues) => {
    if (!user) {
      showError("Vous devez être connecté pour enregistrer une présence.");
      return;
    }

    setLoading(true);
    let hoursWorked: number | null = null;
    if (values.status === "Present" && values.clockInTime && values.clockOutTime) {
      hoursWorked = calculateHoursWorked(values.clockInTime, values.clockOutTime);
    }

    const { error } = await supabase.from("daily_attendances").insert([
      {
        user_id: user.id,
        team_member_id: values.teamMemberId,
        attendance_date: format(values.attendanceDate, "yyyy-MM-dd"),
        status: values.status,
        clock_in_time: values.clockInTime || null,
        clock_out_time: values.clockOutTime || null,
        hours_worked: hoursWorked,
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

  const status = form.watch("status");

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
              value={status}
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

          {status === "Present" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="clockInTime">Heure d'entrée</Label>
                <Input
                  id="clockInTime"
                  type="time"
                  {...form.register("clockInTime")}
                  disabled={loading}
                />
                {form.formState.errors.clockInTime && (
                  <p className="text-red-500 text-sm">{form.formState.errors.clockInTime.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="clockOutTime">Heure de sortie</Label>
                <Input
                  id="clockOutTime"
                  type="time"
                  {...form.register("clockOutTime")}
                  disabled={loading}
                />
                {form.formState.errors.clockOutTime && (
                  <p className="text-red-500 text-sm">{form.formState.errors.clockOutTime.message}</p>
                )}
              </div>
            </>
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