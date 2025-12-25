"use client";

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TeamMemberProfileCard } from "@/components/team-members/TeamMemberProfileCard";
import { EditTeamMemberForm } from "@/components/team-members/EditTeamMemberForm"; // Import the new edit form
import { TeamMemberAttendanceList } from "@/components/team-members/TeamMemberAttendanceList";
import { TeamMemberLeaveRequestsList } from "@/components/team-members/TeamMemberLeaveRequestsList";
import { TeamMemberOvertimeRequestsList } from "@/components/team-members/TeamMemberOvertimeRequestsList";
import { TeamMemberTourList } from "@/components/team-members/TeamMemberTourList";

interface TeamMember {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

const TeamMemberDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useSession();

  const { data: teamMember, isLoading, error } = useQuery<TeamMember>({
    queryKey: ["team_member_details", id],
    queryFn: async () => {
      if (!user || !id) throw new Error("User not authenticated or team member ID is missing.");
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Chargement des détails du membre de l'équipe...</p>
      </div>
    );
  }

  if (error) {
    showError("Erreur lors du chargement des détails du membre de l'équipe: " + error.message);
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Détails du Membre de l'Équipe</CardTitle>
          </CardHeader>
          <CardContent className="text-red-500">
            Erreur: {error.message}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teamMember) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Détails du Membre de l'Équipe</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Membre de l'équipe introuvable.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Détails de {teamMember.name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamMemberProfileCard teamMember={teamMember} />
        <EditTeamMemberForm teamMember={teamMember} /> {/* Add the edit form here */}
        <TeamMemberAttendanceList teamMemberId={teamMember.id} />
        <TeamMemberLeaveRequestsList teamMemberId={teamMember.id} />
        <TeamMemberOvertimeRequestsList teamMemberId={teamMember.id} />
        <TeamMemberTourList teamMemberId={teamMember.id} />
      </div>
    </div>
  );
};

export default TeamMemberDetails;