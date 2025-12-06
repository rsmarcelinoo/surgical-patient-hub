/**
 * AppLayout Component
 * 
 * Main layout wrapper that provides consistent sidebar navigation across all pages.
 * Uses the SidebarProvider for collapsible sidebar functionality.
 * 
 * Features:
 * - Responsive sidebar navigation
 * - Consistent header across pages
 * - Full-height layout with scrollable content area
 */

import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

interface AppLayoutProps {
  /** The main content to render within the layout */
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Compact Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card/95 backdrop-blur px-4">
            <SidebarTrigger className="-ml-1" />
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">GesDoente</span>
            </Link>
          </header>
          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
