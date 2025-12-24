"use client";

import { AddTeamMemberForm } from "@/components/team-members/AddTeamMemberForm";
import { TeamMembersList } from "@/components/team-members/TeamMembersList";

const Presence = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Suivi de Présence</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Gérez les membres de votre équipe et suivez leur présence.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddTeamMemberForm />
        <TeamMembersList />
      </div>
    </div>
  );
};

export default Presence;