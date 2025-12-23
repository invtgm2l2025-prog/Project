"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { MadeWithDyad } from "@/components/made-with-dyad";

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};