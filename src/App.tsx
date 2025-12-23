import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Presence from "./pages/Presence";
import LeaveAbsence from "./pages/LeaveAbsence";
import Overtime from "./pages/Overtime";
import TourPlanning from "./pages/TourPlanning";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { SessionContextProvider } from "@/components/auth/SessionContextProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="presence" element={<Presence />} />
              <Route path="leave-absence" element={<LeaveAbsence />} />
              <Route path="overtime" element={<Overtime />} />
              <Route path="tour-planning" element={<TourPlanning />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;