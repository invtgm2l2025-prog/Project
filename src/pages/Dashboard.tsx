"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Présence Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">5/7 membres présents</p>
            <p className="text-sm text-muted-foreground">Dernière mise à jour: 10:30</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Congés en Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">2 demandes</p>
            <p className="text-sm text-muted-foreground">À examiner</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Heures Supplémentaires (Semaine)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">12 heures</p>
            <p className="text-sm text-muted-foreground">Total de l'équipe</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tournées Planifiées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">3 tournées</p>
            <p className="text-sm text-muted-foreground">Pour demain</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Activités Récentes</h2>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-2">
              <li><span className="font-medium">Jean Dupont</span> a enregistré son entrée à 08:05.</li>
              <li><span className="font-medium">Marie Curie</span> a demandé un congé du 15/10 au 17/10.</li>
              <li><span className="font-medium">Pierre Martin</span> a enregistré sa sortie à 17:15.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;