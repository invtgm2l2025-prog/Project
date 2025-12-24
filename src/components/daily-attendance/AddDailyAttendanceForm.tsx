"use client";

import React, { useState } from "react";
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

interface TeamMember {
  id: string;
  name: string;
}

export const AddDailyAttendanceForm = () => {
  const [teamMemberId, setTeamMemberId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<string>("Present");
  const [hoursWorked, setHoursWorked] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSession();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError("Vous devez être connecté pour enregistrer une présence.");
      return;
    }
    if (!teamMemberId || !attendanceDate || !status) {
      showError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const parsedHours = status === "Present" && hoursWorked.trim() !== "" ? parseFloat(hoursWorked) : null;
    if (status === "Present" && hoursWorked.trim() !== "" && (isNaN(parsedHours!) || parsedHours! <= 0)) {
      showError("Veuillez entrer un nombre d'heures valide pour le statut 'Présent'.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("daily_attendances").insert([
      {
        user_id: user.id,
        team_member_id: teamMemberId,
        attendance_date: format(attendanceDate, "yyyy-MM-dd"),
        status: status,
        hours_worked: parsedHours,
        description: description.trim() || null,
      },
    ]);

    if (error) {
      console.error("Erreur lors de l'enregistrement de la présence:", error);
      showError("Échec de l'enregistrement de la présence: " + error.message);
    } else {
      showSuccess("Présence enregistrée avec succès !");
      setTeamMemberId("");
      setAttendanceDate(undefined);
      setStatus("Present");
      setHoursWorked("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["daily_attendances"] });
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Enregistrer une Présence Quotidienne</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="teamMember">Membre de l'équipe</Label>
            <Select
              value={teamMemberId}
              onValueChange={setTeamMemberId}
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attendanceDate">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !attendanceDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {attendanceDate ? format(attendanceDate, "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={attendanceDate}
                  onSelect={setAttendanceDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={status}
              onValueChange={setStatus}
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
          </div>

          {status === "Present" && (
            <div className="grid gap-2">
              <Label htmlFor="hoursWorked">Heures travaillées (optionnel)</Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                placeholder="Ex: 8.00"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Journée de travail normale, absence justifiée..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
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