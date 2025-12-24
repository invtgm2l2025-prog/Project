"use client";

import { Link } from "react-router-dom";
import { Home, Clock, CalendarDays, Hourglass, Map, User, LogOut, ClipboardCheck, BarChart2 } from "lucide-react"; // Import BarChart2 icon
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const Sidebar = () => {
  const isMobile = useIsMobile();

  const navItems = [
    { name: "Tableau de bord", icon: Home, path: "/" },
    { name: "Présence", icon: Clock, path: "/presence" },
    { name: "Présences Quotidiennes", icon: ClipboardCheck, path: "/daily-attendance" },
    { name: "Rapports de Présence", icon: BarChart2, path: "/attendance-summary" }, // New Attendance Summary link
    { name: "Congés & Absences", icon: CalendarDays, path: "/leave-absence" },
    { name: "Heures Supplémentaires", icon: Hourglass, path: "/overtime" },
    { name: "Planification des Tournées", icon: Map, path: "/tour-planning" },
    { name: "Profil", icon: User, path: "/profile" },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erreur lors de la déconnexion:", error);
      showError("Échec de la déconnexion: " + error.message);
    } else {
      showSuccess("Vous avez été déconnecté avec succès.");
      // The SessionContextProvider will handle the navigation to /login
    }
  };

  if (isMobile) {
    return null;
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
      <div className="mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
};