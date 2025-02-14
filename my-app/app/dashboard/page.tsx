"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Trash2, Pencil } from "lucide-react"; // Import icons
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils"
import React from "react";
import { add, format } from "date-fns";
import { TimePickerDemo } from "@/components/time-picker-demo";
type Pub = {
  id: number;
  title: string;
  date: string;
};

export default function Page() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pubName, setPubName] = useState("");
  const [date, setDate] = React.useState<Date>();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
  
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    
    const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(date);
    const [weekday, day, month, time] = formattedDate.split(" ");
  
    // If it's today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${time}`;
    }

    // if it's this week
    if (date > now && date < add(now, { days: 7 - now.getDay() })) {
      return `${weekday} at ${time}`;
    }
  
    // Default format
    return `${day} ${month} at ${time}`;
  };

  const handleSelect = (newDay: Date | undefined) => {
    if (!newDay) return;
    if (!date) {
      setDate(newDay);
      return;
    }
    const diff = newDay.getTime() - date.getTime();
    const diffInDays = diff / (1000 * 60 * 60 * 24);
    const newDateFull = add(date, { days: Math.ceil(diffInDays) });
    setDate(newDateFull);
  };
  
  
  
  // Fetch Pubs
  useEffect(() => {
    async function fetchPubs() {
      try {
        const response = await fetch("http://localhost:3000/api/events/getUpcoming", {
        method: "GET",
        credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch pubs");

        const data = await response.json();
        setPubs(data);
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchPubs();
  }, []);

  // Add Pub Handler
  const addPub = async () => {
    if (!pubName) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:3000/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: pubName, date: date }),
      });

      if (!response.ok) throw new Error("Failed to add pub");

      const newPub = await response.json();
      console.log(newPub.event);
      setPubs([...pubs, newPub.event]); // Update UI
      setName(""); // Clear input
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Pub Handler
  const deletePub = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/events/delete${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete pub");

      setPubs(pubs.filter((pub) => pub.id !== id)); // Remove from UI
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
        </header>

        <div className="p-4">
          {/* Add Pub Row */}
          <div className="flex items-center gap-4 p-4 border rounded-lg shadow-sm bg-secondary mb-4 max-w-[1200px] w-full">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[30%] justify-start text-left font-normal truncate",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP HH:mm:ss") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => handleSelect(d)}
                  initialFocus
                />
                <div className="p-3 border-t border-border">
                  <TimePickerDemo setDate={setDate} date={date} />
                </div>
              </PopoverContent>
            </Popover>

            {/* Pub Name Input */}
            <Input
              placeholder="Enter pub name..."
              value={pubName}
              onChange={(e) => setPubName(e.target.value)}
              className="flex-1 text-center font-semibold bg-white"
            />

            {/* Plus Button */}
            <Button variant="default" onClick={addPub}>
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* List of Pubs */}
          <div className="mt-4 space-y-2 max-w-[1200px] w-full">
          {pubs.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))]">No pubs available.</p>
          ) : (
            pubs.map((pub) => (
              <div
                key={pub.id}
                className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-muted/50 relative"
              >
                {/* Date with ShadCN color */}
                <div className="text-lg font-medium text-primary leading-relaxed">
                  {formatDate(pub.date)}
                </div>

                {/* Pub Name Centered */}
                <div className="text-xl font-regular text-center sm:text-left sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
                  {pub.title}
                </div>

                {/* Action Buttons on the Right */}
                <div className="w-full sm:w-1/4 flex justify-end gap-2 mt-2 sm:mt-0">
                  <Button size="icon" variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => deletePub(pub.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>


        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
