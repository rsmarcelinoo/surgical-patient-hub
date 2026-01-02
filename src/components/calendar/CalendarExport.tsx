/**
 * CalendarExport Component
 * 
 * Provides export functionality for surgeries to Apple and Google Calendar
 * via .ics file generation.
 */

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Download } from "lucide-react";
import { toast } from "sonner";

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  durationMinutes?: number;
}

interface CalendarExportProps {
  event: CalendarEvent;
  trigger?: React.ReactNode;
}

function generateICS(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const endDate = event.endDate || 
    new Date(event.startDate.getTime() + (event.durationMinutes || 60) * 60000);

  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Medical Surgery App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  lines.push(
    `UID:${Date.now()}@surgery-app`,
    `DTSTAMP:${formatDate(new Date())}`,
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

function downloadICS(event: CalendarEvent, filename: string) {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success("Calendar file downloaded - open it to add to your calendar");
}

function openGoogleCalendar(event: CalendarEvent) {
  const formatGoogleDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const endDate = event.endDate || 
    new Date(event.startDate.getTime() + (event.durationMinutes || 60) * 60000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(endDate)}`,
    details: event.description || "",
    location: event.location || "",
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
  toast.success("Opening Google Calendar");
}

export function CalendarExport({ event, trigger }: CalendarExportProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-1" />
            Export
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadICS(event, event.title.replace(/\s+/g, "-"))}>
          <Download className="h-4 w-4 mr-2" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openGoogleCalendar(event)}>
          <Calendar className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Utility function to export multiple events
export function exportMultipleToICS(events: CalendarEvent[], filename: string) {
  const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");
  
  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Medical Surgery App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((event, index) => {
    const endDate = event.endDate || 
      new Date(event.startDate.getTime() + (event.durationMinutes || 60) * 60000);

    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${escapeText(event.title)}`
    );

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`);
    }

    lines.push(
      `UID:${Date.now()}-${index}@surgery-app`,
      `DTSTAMP:${formatDate(new Date())}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  const icsContent = lines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success(`${events.length} events exported`);
}
