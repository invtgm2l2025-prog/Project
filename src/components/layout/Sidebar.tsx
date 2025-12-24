"use client";

import { Link } from "react-router-dom";
import { Home, Clock, CalendarDays, Hourglass, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

export const Sidebar = () => {
  const isMobile = useIsMobile();

  const navItems = [
    { name: "Tableau de bord", icon: Home, path: "/" },
    { name: "Présence", icon: Clock, path: "/presence" },
    { name: "Congés & Absences", icon: CalendarDays, path: "/leave-absence" },
    { name: "Heures Supplémentaires", icon: Hourglass, path: "/overtime" },
    { name: "Planification des Tournées", icon: Map, path: "/tour-planning" },
  ];

  if (isMobile) {
    // For mobile, we might want a different approach, e.g., a bottom navigation or a drawer.
    // For now, we'll keep it simple and just hide the full sidebar.
    // A full mobile navigation solution would involve a Drawer component.
    return null; // Or implement a mobile-specific navigation here
  }

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r bg-sidebar text-sidebar-foreground p-4">
      <div className="flex items-center justify-center h-16 border-b mb-4">
        <h2 className="text-xl font-semibold text-sidebar-primary-foreground">Team Tracker</h2>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid gap-2">
          {navItems.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    // Add active state styling later if needed
                  )}
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.name}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
};