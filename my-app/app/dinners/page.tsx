"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { Textarea } from "@/components/ui/textarea";
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

type Dinner = {
  id: number;
  title: string;
  date: string;
  signup_link: string;
  description: string;
  event_link: string;
  venue_id: number;
  allowed_guests: string;
  price_without_alcohol: number;
  price_with_alcohol: number;
  signup_date: string;
};

type Venue = {
  id: number;
  name: string;
};

function DinnerAccordionItem({
  dinner,
  venues,
  deleteDinner,
  updateDinner,
  formatDate,
  showMessage,
}: {
  dinner: Dinner;
  venues: Venue[];
  deleteDinner: (id: number) => void;
  updateDinner: (dinner: Dinner) => void;
  formatDate: (date: string) => string;
  showMessage: (text: string, type: "success" | "error") => void;
}) {
  const [editable, setEditable] = useState(false);
  const [editedDinner, setEditedDinner] = useState<Dinner>(dinner);

  const handleChange = (field: keyof Dinner, value: string | number) => {
    if (field === "date") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) {
        showMessage("You cannot select a past date", "error");
        return;
      }
    }
    setEditedDinner((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateDinner(editedDinner);
    setEditable(false);
  };

  return (
    <AccordionItem
      value={`dinner-${dinner.id}`}
      className="rounded-lg border bg-muted/50"
    >
      <div className="relative flex items-center justify-between p-4">
        {/* Left: Date */}
        <div className="rounded-lg border border-gray-300 bg-gray-200 px-3 py-1 text-lg font-medium text-primary shadow-sm">
          {formatDate(dinner.date)}
        </div>

        {/* Center: Dinner Title */}
        <div className="sm:truncate-0 absolute left-1/2 max-w-[30vw] -translate-x-1/2 truncate text-center text-xl sm:max-w-none sm:whitespace-normal">
          {dinner.title}
        </div>

        {/* Right: Invisible placeholder to balance layout */}
        <div className="invisible h-8 w-[120px]" />

        {/* Action Buttons */}
        <div className="mt-2 flex w-full justify-end gap-2 sm:mt-0 sm:w-1/4">
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
                  "Are you sure you want to delete this dinner? This action cannot be undone.",
                )
              ) {
                deleteDinner(dinner.id);
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Expand Button */}
      <AccordionTrigger className="w-full border-t px-4 py-2 text-sm font-medium hover:bg-muted">
        Show details
      </AccordionTrigger>

      {/* Dinner Details */}
      {/* Date Display or Picker */}
      <AccordionContent className="grid grid-cols-1 gap-4 border-t px-4 py-3 sm:grid-cols-2">
        {/* Date Display or Picker */}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`title-${dinner.id}`}>Date</Label>
          <DateTimePicker
            date={editedDinner.date ? new Date(editedDinner.date) : undefined}
            setDate={(selectedDate) => {
              handleChange("date", selectedDate?.toISOString() || "");
            }}
            disabled={!editable}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`signup-date-${dinner.id}`}>Signup Date</Label>
          <DateTimePicker
            date={
              editedDinner.signup_date
                ? new Date(editedDinner.signup_date)
                : undefined
            }
            setDate={(selectedDate) =>
              handleChange(
                "signup_date",
                selectedDate ? selectedDate.toISOString() : "",
              )
            }
            disabled={!editable}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`title-${dinner.id}`}>Title</Label>
          <Input
            id={`title-${dinner.id}`}
            value={editedDinner.title}
            disabled={!editable}
            onChange={(e) => handleChange("title", e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Venue</Label>
          <Select
            value={editedDinner.venue_id?.toString() || ""}
            onValueChange={(value) => handleChange("venue_id", Number(value))}
            disabled={!editable}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select venue" />
            </SelectTrigger>
            <SelectContent className="h-[250px] overflow-y-auto">
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id.toString()}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label>Allowed Guests</Label>
          <Select
            value={editedDinner.allowed_guests}
            onValueChange={(value) => handleChange("allowed_guests", value)}
            disabled={!editable}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select allowed guests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_students">All Students</SelectItem>
              <SelectItem value="members">Chapter Members Only</SelectItem>
              <SelectItem value="members_plus_one">
                Chapter Members + 1 Guest
              </SelectItem>
              <SelectItem value="kmr">KMR Members</SelectItem>
              <SelectItem value="everyone">Everyone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`price-without-alcohol-${dinner.id}`}>
            Price (without alcohol)
          </Label>
          <Input
            id={`price-without-alcohol-${dinner.id}`}
            type="number"
            value={editedDinner.price_without_alcohol}
            disabled={!editable}
            onChange={(e) =>
              handleChange("price_without_alcohol", Number(e.target.value))
            }
            className="bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`price-with-alcohol-${dinner.id}`}>
            Price (with alcohol)
          </Label>
          <Input
            id={`price-with-alcohol-${dinner.id}`}
            type="number"
            value={editedDinner.price_with_alcohol}
            disabled={!editable}
            onChange={(e) =>
              handleChange("price_with_alcohol", Number(e.target.value))
            }
            className="bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`signup-link-${dinner.id}`}>Signup Link</Label>
          <Input
            id={`signup-link-${dinner.id}`}
            value={editedDinner.signup_link}
            disabled={!editable}
            onChange={(e) => handleChange("signup_link", e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor={`event-link-${dinner.id}`}>Event Link</Label>
          <Input
            id={`event-link-${dinner.id}`}
            value={editedDinner.event_link}
            disabled={!editable}
            onChange={(e) => handleChange("event_link", e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <Label htmlFor={`description-${dinner.id}`}>Description</Label>
          <Textarea
            id={`description-${dinner.id}`}
            value={editedDinner.description}
            disabled={!editable}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full bg-white"
            rows={4} // Adjust number of visible rows
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

const formatURL = (url: string): string => {
  const trimmedUrl = url.trim();
  if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
    return `https://${trimmedUrl}`;
  }
  return trimmedUrl;
};

export default function Page() {
  const [dinners, setDinners] = useState<Dinner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = React.useState<Date>();
  const [event_link, setEventLink] = useState("");

  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [signupLink, setSignupLink] = useState("");
  const [venueId, setVenueId] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [allowedGuests, setAllowedGuests] = useState("");
  const [priceWithoutAlcohol, setPriceWithoutAlcohol] = useState("");
  const [priceWithAlcohol, setPriceWithAlcohol] = useState("");
  const [signupDate, setSignupDate] = useState<Date | undefined>();

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

  // Fetch dinners
  useEffect(() => {
    async function fetchDinners() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dinners/getUpcoming`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) throw new Error("Failed to fetch dinners");

        const data = await response.json();
        setDinners(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({ text: "An unknown error occurred", type: "error" });
        }
      }
    }
    fetchDinners();
  }, []);

  useEffect(() => {
    async function fetchVenues() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/venues`,
          { method: "GET", credentials: "include" },
        );
        if (!response.ok) throw new Error("Failed to fetch venues");
        const data = await response.json();
        setVenues(data);
      } catch {
        setMessage({ text: "Could not fetch venues", type: "error" });
      }
    }
    fetchVenues();
  }, []);
  useEffect(() => {
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

  // Add Dinner
  const addDinner = async () => {
    if (!eventTitle || !date || !allowedGuests) {
      showMessage(
        "Please provide at least title, date and allowed guests.",
        "error",
      );
      return;
    }

    const formated_singup_link = formatURL(signupLink);
    const formated_event_link = formatURL(event_link);

    const localDate = toZonedTime(date, "Europe/Stockholm");
    const formattedDate = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

    const localSignupDate = signupDate
      ? toZonedTime(signupDate, "Europe/Stockholm")
      : undefined;
    const formattedSignupDate = localSignupDate
      ? format(localSignupDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
      : undefined;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dinners/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: eventTitle,
            date: formattedDate,
            description: description,
            signup_link: formated_singup_link,
            event_link: formated_event_link,
            venue_id: venueId,
            allowed_guests: allowedGuests,
            price_without_alcohol: priceWithoutAlcohol,
            price_with_alcohol: priceWithAlcohol,
            signup_date: formattedSignupDate,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? "Dinner already exists"
            : "Failed to add Dinner",
        );
      }

      const newDinner = await response.json();
      setDinners([...dinners, newDinner.dinner]);
      showMessage("Dinner added successfully!", "success");
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

  const deleteDinner = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dinners/delete${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Failed to delete dinner");

      setDinners(dinners.filter((dinner) => dinner.id !== id));
      showMessage("Dinner deleted successfully!", "success");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred", type: "error" });
      }
    }
  };

  const updateDinner = async (dinner: Dinner) => {
    const localDate = toZonedTime(dinner.date, "Europe/Stockholm");
    const formattedDate = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

    const formatted_singup_link = formatURL(dinner.signup_link);
    const formatted_event_link = formatURL(dinner.event_link);

    const localSignupDate = dinner.signup_date
      ? toZonedTime(dinner.signup_date, "Europe/Stockholm")
      : undefined;
    const formattedSignupDate = localSignupDate
      ? format(localSignupDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
      : undefined;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dinners/update${dinner.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            id: dinner.id,
            title: dinner.title,
            date: formattedDate,
            description: dinner.description,
            signup_link: formatted_singup_link,
            event_link: formatted_event_link,
            venue_id: dinner.venue_id,
            allowed_guests: dinner.allowed_guests,
            price_without_alcohol: dinner.price_without_alcohol,
            price_with_alcohol: dinner.price_with_alcohol,
            signup_date: formattedSignupDate,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update Dinner");

      const updatedDinner = await response.json();

      setDinners((prevDinners) =>
        prevDinners.map((d) =>
          d.id === updatedDinner.dinner.id ? updatedDinner.dinner : d,
        ),
      );

      showMessage("Dinner updated successfully!", "success");
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

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start truncate text-left font-normal sm:w-[30%]",
                    !signupDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {signupDate ? (
                    format(signupDate, "PPP HH:mm:ss")
                  ) : (
                    <span>Signup until</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={signupDate}
                  onSelect={setSignupDate}
                  initialFocus
                />
                <div className="border-t border-border p-3">
                  <TimePickerDemo setDate={setSignupDate} date={signupDate} />
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
              value={event_link}
              onChange={(e) => setEventLink(e.target.value)}
              className="w-full bg-white"
            />

            {/* Venue Dropdown */}
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger className="w-full bg-white sm:w-[48%]">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent className="h-[250px] overflow-y-auto">
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id.toString()}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Allowed Guests Dropdown */}
            <Select value={allowedGuests} onValueChange={setAllowedGuests}>
              <SelectTrigger className="w-full bg-white sm:w-[48%]">
                <SelectValue placeholder="Select allowed guests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_students">All Students</SelectItem>
                <SelectItem value="members">Chapter Members Only</SelectItem>
                <SelectItem value="members_plus_one">
                  Chapter Members + 1 Guest
                </SelectItem>
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
              className="w-full bg-white sm:w-[48%]"
            />

            {/* Price with Alcohol */}
            <Input
              placeholder="Price with alcohol..."
              type="number"
              min="0"
              value={priceWithAlcohol}
              onChange={(e) => setPriceWithAlcohol(e.target.value)}
              className="w-full bg-white sm:w-[48%]"
            />

            {/* Submit Button */}
            <Button variant="default" onClick={addDinner} className="w-full">
              <PlusIcon className="mr-2 size-5" />
              Add Event
            </Button>
          </div>

          {/* List of Dinners */}

          <div className="mt-4 w-full max-w-[1200px] space-y-2">
            {dinners.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))]">
                No dinners available.
              </p>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {dinners.map((dinner) => (
                  <DinnerAccordionItem
                    key={dinner.id}
                    dinner={dinner}
                    deleteDinner={deleteDinner}
                    updateDinner={updateDinner}
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
