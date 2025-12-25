"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TeamMember {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface TeamMemberProfileCardProps {
  teamMember: TeamMember;
}

export const TeamMemberProfileCard = ({ teamMember }: TeamMemberProfileCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{teamMember.name}</CardTitle>
        <User className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2">
        <CardDescription>
          Membre de l'équipe depuis le {format(new Date(teamMember.created_at), "PPP", { locale: fr })}
        </CardDescription>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Statut actuel:</span>
          <Badge
            className={
              teamMember.status === "Présent"
                ? "bg-green-500 hover:bg-green-600"
                : teamMember.status === "Absent"
                ? "bg-red-500 hover:bg-red-600"
                : teamMember.status === "En congé"
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-yellow-500 hover:bg-yellow-600"
            }
          >
            {teamMember.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};