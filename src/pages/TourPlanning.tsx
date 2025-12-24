"use client";

import React from "react";
import { AddTourForm } from "@/components/tour-planning/AddTourForm";
import { TourList } from "@/components/tour-planning/TourList";

const TourPlanning = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Planification des Tournées</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Organisez et attribuez les tournées à vos livreurs.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddTourForm />
        <TourList />
      </div>
    </div>
  );
};

export default TourPlanning;