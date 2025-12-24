"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
// Removed Input as it was not used
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

export const AddTourForm = () => {
  const [teamMemberId, setTeamMemberId] = useState<string>("");
  const [tourDate, setTourDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["team_members_for_tour"],
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
      showError("Vous devez être connecté pour planifier une tournée.");
      return;
    }
    if (!teamMemberId || !tourDate) {
      showError("Veuillez sélectionner un membre d'équipe et une date pour la tournée.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("tours").insert([
      {
        user_id: user.id,
        team_member_id: teamMemberId,
        tour_date: format(tourDate, "yyyy-MM-dd"),
        description: description.trim() || null,
        status: "Planned",
      },
    ]);

    if (error) {
      console.error("Erreur lors de la planification de la tournée:", error);
      showError("Échec de la planification de la tournée: " + error.message);
    } else {
      showSuccess("Tournée planifiée avec succès !");
      setTeamMemberId("");
      setTourDate(undefined);
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Planifier une nouvelle tournée</CardTitle>
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
            <Label htmlFor="tourDate">Date de la tournée</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !tourDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tourDate ? format(tourDate, "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={tourDate}
                  onSelect={setTourDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Livraison de colis dans le quartier nord."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Planification en cours...
              </>
            ) : (
              "Planifier la tournée"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};