"use client";

import React from "react";
import { AddLeaveRequestForm } from "@/components/leave-absence/AddLeaveRequestForm";
import { LeaveRequestsList } from "@/components/leave-absence/LeaveRequestsList";

const LeaveAbsence = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des Congés & Absences</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Soumettez et gérez les demandes de congés pour les membres de votre équipe.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddLeaveRequestForm />
        <LeaveRequestsList />
      </div>
    </div>
  );
};

export default LeaveAbsence;