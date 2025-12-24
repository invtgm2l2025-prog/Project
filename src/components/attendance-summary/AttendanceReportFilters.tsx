"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { fr } from "date-fns/locale";
import { CalendarIcon, FilterIcon, Loader2 } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
}

interface AttendanceReportFiltersProps {
  onApplyFilters: (filters: {
    startDate: Date | undefined;
    endDate: Date | undefined;
    teamMemberId: string;
    reportType: "daily" | "weekly" | "monthly";
  }) => void;
}

export const AttendanceReportFilters = ({ onApplyFilters }: AttendanceReportFiltersProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string>("");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const { user } = useSession();

  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["team_members_for_reports"],
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

  const handleApply = () => {
    onApplyFilters({ startDate, endDate, teamMemberId: selectedTeamMemberId, reportType });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Filtrer les Rapports</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endDate">Date de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="teamMember">Membre de l'équipe</Label>
          <Select
            value={selectedTeamMemberId}
            onValueChange={setSelectedTeamMemberId}
            disabled={isLoadingTeamMembers}
          >
            <SelectTrigger id="teamMember">
              <SelectValue placeholder="Tous les membres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les membres</SelectItem>
              {isLoadingTeamMembers ? (
                <SelectItem value="loading" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement...
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
          <Label htmlFor="reportType">Type de rapport</Label>
          <Select
            value={reportType}
            onValueChange={(value: "daily" | "weekly" | "monthly") => setReportType(value)}
          >
            <SelectTrigger id="reportType">
              <SelectValue placeholder="Quotidien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 lg:col-span-4 flex justify-end">
          <Button onClick={handleApply} className="w-full md:w-auto">
            <FilterIcon className="mr-2 h-4 w-4" />
            Appliquer les filtres
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};