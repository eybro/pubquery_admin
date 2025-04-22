"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Trash2, Pencil, Save } from "lucide-react"; // Import icons
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import React from "react";
import { add, format } from "date-fns";
import { TimePickerDemo } from "@/components/time-picker-demo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function DateTimePicker({
  date,
  setDate,
  disabled,
}: {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
}) {
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          className={cn(
            "w-full justify-start truncate text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "PPP HH:mm:ss") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
        <div className="border-t border-border p-3">
          <TimePickerDemo setDate={setDate} date={date} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

type Pub = {
  id: number;
  title: string;
  date: string;
  auto_created: number;
  fb_link: string;
  venue_id: number;
};

type Venue = {
  id: number;
  name: string;
};


function PubAccordionItem({
  pub,
  deletePub,
  updatePub,
  formatDate,
  showMessage,
  venues,
}: {
  pub: Pub;
  venues: Venue[];
  deletePub: (id: number) => void;
  updatePub: (pub: Pub) => void;
  formatDate: (date: string) => string;
  showMessage: (text: string, type: "success" | "error") => void;
}) {
  const [editable, setEditable] = useState(false);
  const [editedPub, seteditedPub] = useState<Pub>(pub);

  const handleChange = (field: keyof Pub, value: string | number) => {
    if (field === "date") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) {
        showMessage("You cannot select a past date", "error");
        return;
      }
    }
    seteditedPub((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updatePub(editedPub);
    setEditable(false);
  };

  return (
    <AccordionItem
  value={`pub-${pub.id}`}
  className="rounded-lg border bg-muted/50"
>
  <div className="flex flex-col items-center gap-2 p-4 sm:relative sm:flex-row sm:justify-between sm:gap-0">
    {/* Date (left on larger screens) */}
    <div className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1 text-lg font-medium text-primary shadow-sm">
      {formatDate(pub.date)}
    </div>

    {/* Title - stacked on mobile, centered absolute on desktop */}
    <div className="text-center text-xl sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:whitespace-nowrap">
      {pub.title}
    </div>

    

    {/* Action Buttons (right on larger screens) */}
    {/* Action Buttons (right on larger screens) */}
<div className="flex flex-col items-end gap-2 sm:w-1/4">
  <div className="flex items-center gap-2">
    {editable ? (
      <Button size="icon" variant="default" onClick={handleSave}>
        <Save className="size-4" />
      </Button>
    ) : (
      <Button
        size="icon"
        variant="outline"
        onClick={() => setEditable(true)}
      >
        <Pencil className="size-4" />
      </Button>
    )}
    <Button
      size="icon"
      variant="destructive"
      onClick={() => {
        if (
          confirm(
            "Are you sure you want to delete this pub? This action cannot be undone.",
          )
        ) {
          deletePub(pub.id);
        }
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  </div>
  
  {pub.auto_created === 1 && (
    <span className="border-black-300 inline-flex h-6 items-center rounded-md border bg-green-600 px-2 py-0.5 text-[12px] font-semibold text-white">
      System Generated
    </span>
  )}
</div>

  </div>

      {/* Expand Button */}
      <AccordionTrigger className="w-full border-t px-4 py-2 text-sm font-medium hover:bg-muted">
        Show details
      </AccordionTrigger>

  

     <AccordionContent className="grid grid-cols-1 gap-4 border-t px-4 py-3 sm:grid-cols-2">
             {/* Date Display or Picker */}
             <div className="flex flex-col gap-1">
               <Label htmlFor={`title-${pub.id}`}>Date</Label>
               <DateTimePicker
                 date={editedPub.date ? new Date(editedPub.date) : undefined}
                 setDate={(selectedDate) => {
                   handleChange("date", selectedDate?.toISOString() || "");
                 }}
                 disabled={!editable}
               />
             </div>
     
             <div className="flex flex-col gap-1">
               <Label htmlFor={`title-${pub.id}`}>Title</Label>
               <Input
                 id={`title-${pub.id}`}
                 value={editedPub.title}
                 disabled={!editable}
                 onChange={(e) => handleChange("title", e.target.value)}
                 className="bg-white"
               />
             </div>
     
      
        <div className="flex flex-col gap-1">
          <Label>Venue</Label>
          <Select value={editedPub.venue_id.toString()} onValueChange={(value) => handleChange("venue_id", value)} disabled={!editable}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`event-link-${pub.id}`}>Event Link</Label>
          <Input
            id={`event-link-${pub.id}`}
            value={editedPub.fb_link ?? ""}
            disabled={!editable}
            onChange={(e) => handleChange("fb_link", e.target.value)}
            className="bg-white"
          />
        </div>

      </AccordionContent>
    </AccordionItem>
  );
}

function formatURL(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  return url.trim().startsWith('http') ? url : `https://${url.trim()}`;
}

export default function Page() {
  const [pubs, setpubs] = useState<Pub[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = React.useState<Date>();
  const [event_link, setEventLink] = useState("");

  const [eventTitle, setEventTitle] = useState("");

  const [venueId, setVenueId] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [message, setMessage] = useState<{

    text: string;
    type: "success" | "error";
  }>();

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(undefined), 3000);
  };

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
      timeZone: "CET",
    };

    const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(
      date,
    );
    let split = formattedDate.split(" ");
    split = split.filter((word) => word !== "at");
    const [weekday, day, month, time] = split;

    // If it's today
    if (date.toUTCString().slice(0, 16) === now.toUTCString().slice(0, 16)) {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDay < today) {
      showMessage("You cannot select a past date", "error");
      return;
    }

    if (!date) {
      setDate(newDay);
      return;
    }
    const diff = newDay.getTime() - date.getTime();
    const diffInDays = diff / (1000 * 60 * 60 * 24);
    const newDateFull = add(date, { days: Math.ceil(diffInDays) });

    setDate(newDateFull);
  };

  // Fetch pubs
  useEffect(() => {
    async function fetchPubs() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/events/getUpcoming`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) throw new Error("Failed to fetch pubs");

        const data = await response.json();
        setpubs(data.map((pub: { fb_link: string; }) => ({
          ...pub,
          fb_link: pub.fb_link ?? '',
        })));
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "An unknown error occurred", type: "error" });
        }
      }
    }
    fetchPubs();

    async function fetchVenues() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/venues`,
          {
            method: "GET",
            credentials: "include",
          },
        );
  
        if (!response.ok) throw new Error("Failed to fetch venues");
  
        const data = await response.json();
        setVenues(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "An unknown error occurred", type: "error" });
        }
      }
    }
    fetchVenues();



    const fetchDefaultVenue = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/venue`,
          { credentials: "include" },
        );

        if (!response.ok) throw new Error("Failed to fetch default venue");

        const data = await response.json();
        
        setVenueId(data.venueId.toString());
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "An unknown error occurred", type: "error" });
        }
      }
    };

    fetchDefaultVenue();
  }, []);

  


  // Add pub
  const addpub = async () => {
    if (!eventTitle || !date) {
      showMessage(
        "Please provide at least title and date",
        "error",
      );
      return;
    }
    
    const formated_event_link = formatURL(event_link);

    const localDate = toZonedTime(date, "Europe/Stockholm");
    const formattedDate = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: eventTitle,
            date: formattedDate,
            event_link: formated_event_link === '' ? undefined : formated_event_link,
            location: location,
            venue_id: venueId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? "pub already exists"
            : "Failed to add pub",
        );
      }

      const newpub = await response.json();
      setpubs([...pubs, newpub.event]);
      showMessage("pub added successfully!", "success");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred", type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deletePub = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events/delete${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Failed to delete pub");

      setpubs(pubs.filter((pub) => pub.id !== id));
      showMessage("pub deleted successfully!", "success");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred", type: "error" });
      }
    }
  };

  const updatePub = async (pub: Pub) => {
    const localDate = toZonedTime(pub.date, "Europe/Stockholm");
    const formattedDate = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

    const formatted_event_link = formatURL(pub.fb_link);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events/update${pub.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: pub.id,
            title: pub.title,
            date: formattedDate,
            event_link: formatted_event_link === '' ? undefined : formatted_event_link,
            venue_id: pub.venue_id,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update pub");

      const updatedpub = await response.json();

      setpubs((prevpubs) =>
        prevpubs.map((d) =>
          d.id === updatedpub.event.id ? updatedpub.event : d,
        ),
      );

      showMessage("pub updated successfully!", "success");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred", type: "error" });
      }
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {message && (
          <div
            className={`fixed right-4 top-4 rounded-lg px-4 py-2 text-white shadow-lg ${
              message.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {message.text}
          </div>
        )}
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Add & Edit Pubs</h1>
          </div>
        </header>
        {isLoading && (
          <div className="fixed right-4 top-4 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg">
            Loading...
          </div>
        )}

        <div className="p-4">
          <div className="mb-4 flex w-full max-w-[1200px] flex-wrap gap-4 rounded-lg border bg-secondary p-4 shadow-sm">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start truncate text-left font-normal sm:w-[30%]",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {date ? (
                    format(date, "PPP HH:mm:ss")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => handleSelect(d)}
                  initialFocus
                />
                <div className="border-t border-border p-3">
                  <TimePickerDemo setDate={setDate} date={date} />
                </div>
              </PopoverContent>
            </Popover>

            {/* Title Input */}
            <Input
              placeholder="Enter title..."
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="flex-1 bg-white text-center font-semibold"
            />

            <div className="flex w-full flex-wrap gap-4">
              {/* Venue */}
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger className="w-full bg-white sm:w-[30%]">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Event Link */}
              <Input
                placeholder="Enter event link..."
                value={event_link}
                onChange={(e) => setEventLink(e.target.value)}
                className="flex-1 bg-white"
              />
            </div>

           

            {/* Submit Button */}
            <Button variant="default" onClick={addpub} className="w-full">
              <PlusIcon className="mr-2 size-5" />
              Add Event
            </Button>
          </div>

          {/* List of pubs */}

          <div className="mt-4 w-full max-w-[1200px] space-y-2">
            {pubs.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))]">
                No pubs available.
              </p>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {pubs.map((pub) => (
                  <PubAccordionItem
                    key={pub.id}
                    pub={pub}
                    deletePub={deletePub}
                    updatePub={updatePub}
                    formatDate={formatDate}
                    showMessage={showMessage}
                    venues={venues}
                  />
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
