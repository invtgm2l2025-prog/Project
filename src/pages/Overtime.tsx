"use client";

import React from "react";
import { AddOvertimeRequestForm } from "@/components/overtime/AddOvertimeRequestForm";
import { OvertimeRequestsList } from "@/components/overtime/OvertimeRequestsList";

const Overtime = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Suivi des Heures Supplémentaires</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Soumettez et gérez les demandes d'heures supplémentaires effectuées par votre équipe.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddOvertimeRequestForm />
        <OvertimeRequestsList />
      </div>
    </div>
  );
};

export default Overtime;