/**
 * App Component
 * 
 * Main application entry point with routing configuration.
 * Provides QueryClient, tooltips, toast notifications, and settings context.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Index from "./pages/Index";
import PatientDetail from "./pages/PatientDetail";
import KanbanBoard from "./pages/KanbanBoard";
import CalendarView from "./pages/CalendarView";
import ListView from "./pages/ListView";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/kanban/:id" element={<KanbanBoard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/list" element={<ListView />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
