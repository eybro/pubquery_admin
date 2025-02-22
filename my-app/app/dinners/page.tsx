"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Trash2, Pencil } from "lucide-react"; // Import icons
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



type Pub = {
  id: number;
  title: string;
  date: string;
  auto_created: boolean;
};

export default function Page() {
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pubName, setPubName] = useState("");
  const [date, setDate] = React.useState<Date>();
  const [eventLink, setEventLink] = useState("");

const [eventTitle, setEventTitle] = useState("");
const [description, setDescription] = useState("");
const [signupLink, setSignupLink] = useState("");
const [location, setLocation] = useState("");
const [allowedGuests, setAllowedGuests] = useState("");
const [priceWithoutAlcohol, setPriceWithoutAlcohol] = useState("");
const [priceWithAlcohol, setPriceWithAlcohol] = useState("");


  const [message, setMessage] = useState<{

  
    text: string;
    type: "success" | "error";
  }>();
  const [editPub, setEditPub] = useState<Pub | undefined>(); // Store selected pub for editing

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(undefined), 3000);
  };

  const openEditDialog = (pub: Pub) => {
    setEditPub(pub);
    setName(pub.title);
    setDate(new Date(pub.date));
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


    const [weekday, day, month, time] = formattedDate.split(" ");

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

  // Fetch Pubs
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
        setPubs(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "An unknown error occurred", type: "error" });
        }
      }
    }
    fetchPubs();
  }, []);

  // Add Pub Handler
  const addDinner = async () => {
    if (!pubName || !date) {
      showMessage("Please provide both name and date.", "error");
      return;
    }

    // Convert to local time, adjust to UTC if needed
    const localDate = toZonedTime(date, "Europe/Stockholm"); // Replace 'Europe/Stockholm' with your time zone
    const formattedDate = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dinners/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
        title: eventTitle, 
        date: formattedDate,
        description : description,
        signup_link : signupLink,
        eventLink : eventLink,
        location : location,
        allowed_guests : allowedGuests,
        price_without_alcohol : priceWithoutAlcohol,
        price_with_alcohol : priceWithAlcohol,
       }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 409 ? "Pub already exists" : "Failed to add pub",
        );
      }

      const newPub = await response.json();
      setPubs([...pubs, newPub.event]); // Update UI
      setName(""); // Clear input
      showMessage("Pub added successfully!", "success");
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

  // Delete Pub Handler
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

      setPubs(pubs.filter((pub) => pub.id !== id)); // Remove from UI
      showMessage("Pub deleted successfully!", "success");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred", type: "error" });
      }
    }
  };

  const updatePub = async () => {
    if (!editPub) return;
    if (!name) {
      showMessage("Add an event name", "error");
      return;
    }
    if (!date) {
      showMessage("Add a date", "error");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events/update${editPub.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title: name, date }),
        },
      );

      if (!response.ok) throw new Error("Failed to update pub");

      setPubs((prevPubs) =>
        prevPubs.map((p) =>
          p.id === editPub.id
            ? { ...p, title: name, date: date?.toISOString() || p.date }
            : p,
        ),
      );

      setEditPub(undefined);
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
            <h1 className="text-xl font-semibold">Add & Edit Dinners</h1>
          </div>
        </header>
        {isLoading && (
          <div className="fixed right-4 top-4 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg">
            Loading...
          </div>
        )}

        <div className="p-4">
          {/* Add Pub Row */}
          <div className="mb-4 flex w-full max-w-[1200px] flex-wrap gap-4 rounded-lg border bg-secondary p-4 shadow-sm">
    
    {/* Date Picker */}
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-[30%] justify-start truncate text-left font-normal",
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
      placeholder="Enter event title..."
      value={eventTitle}
      onChange={(e) => setEventTitle(e.target.value)}
      className="flex-1 bg-white text-center font-semibold"
    />

    {/* Description Input */}
    <Textarea
      placeholder="Enter description (max 2000 characters)..."
      value={description}
      onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
      className="w-full bg-white"
      rows={4}
    />

    {/* Signup Link Input */}
    <Input
      placeholder="Enter signup link..."
      value={signupLink}
      onChange={(e) => setSignupLink(e.target.value)}
      className="w-full bg-white"
    />

    {/* Event Link */}
    <Input
      placeholder="Enter event link..."
      value={eventLink}
      onChange={(e) => setEventLink(e.target.value)}
      className="w-full bg-white"
    />

    {/* Location Input */}
    <Input
      placeholder="Enter location..."
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      className="w-full sm:w-[48%] bg-white"
    />

    {/* Allowed Guests Dropdown */}
    <Select value={allowedGuests} onValueChange={setAllowedGuests}>
      <SelectTrigger className="w-full sm:w-[48%] bg-white">
        <SelectValue placeholder="Select allowed guests" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all_students">All Students</SelectItem>
        <SelectItem value="members">Chapter Members Only</SelectItem>
        <SelectItem value="members_plus_one">Chapter Members + 1 Guest</SelectItem>
        <SelectItem value="kmr">KMR Members</SelectItem>
        <SelectItem value="everyone">Everyone</SelectItem>
      </SelectContent>
    </Select>

    {/* Price w/o Alcohol */}
    <Input
      placeholder="Price w/o alcohol..."
      type="number"
      min="0"
      value={priceWithoutAlcohol}
      onChange={(e) => setPriceWithoutAlcohol(e.target.value)}
      className="w-full sm:w-[48%] bg-white"
    />

    {/* Price with Alcohol */}
    <Input
      placeholder="Price with alcohol..."
      type="number"
      min="0"
      value={priceWithAlcohol}
      onChange={(e) => setPriceWithAlcohol(e.target.value)}
      className="w-full sm:w-[48%] bg-white"
    />

    {/* Submit Button */}
    <Button variant="default" onClick={addDinner} className="w-full">
      <PlusIcon className="size-5 mr-2" />
      Add Event
    </Button>
  </div>


          {/* List of Pubs */}
          <div className="mt-4 w-full max-w-[1200px] space-y-2">
            {pubs.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))]">
                No pubs available.
              </p>
            ) : (
              pubs.map((pub) => (
                <div
                  key={pub.id}
                  className="relative flex flex-col items-center justify-between rounded-lg border bg-muted/50 p-4 sm:flex-row"
                >
                  {/* Date */}

                  <div className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1 text-lg font-medium text-primary shadow-sm">
                    {formatDate(pub.date)}
                  </div>

                  {/* Pub Name Centered */}
                  <div className="font-regular flex flex-col items-center text-center text-xl sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:items-start sm:text-left">
                    {pub.title}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-2 flex w-full items-center justify-end gap-2 sm:mt-0 sm:w-1/4">
                    {pub.auto_created && (
                      <span className="border-black-300 flex h-8 items-center rounded-md border bg-green-600 px-2 py-0.5 text-[12px] font-semibold text-white">
                        System Generated
                      </span>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEditDialog(pub)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        if (
                          globalThis.confirm(
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
                </div>
              ))
            )}
          </div>

          <Dialog
            open={Boolean(editPub)}
            onOpenChange={(open) => !open && setEditPub(undefined)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Pub</DialogTitle>
              </DialogHeader>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[70%] justify-start truncate text-left font-normal",
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

              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pub name"
                className="mb-2"
              />

              <Button onClick={updatePub} className="mt-4 w-full">
                Save Changes
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
