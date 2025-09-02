"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, PlusIcon, Trash2, Pencil, Save, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/components/source-badge";

/* ───────────────── helpers ───────────────── */

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
  auto_created: boolean;
  fb_link: string;
  venue_id: number;
  description: string;
  patches: boolean;
  co_host_organization_id?: number 
  cohost_display_name?: string 
};
type Venue = { id: number; name: string };
type Organization = {
  id: number;
  name: string;
  display_name?: string | undefined;
};

function formatURL(url?: string | undefined): string {
  if (!url || typeof url !== "string") return "";
  const u = url.trim();
  return u === ""
    ? ""
    : (u.startsWith("http://") || u.startsWith("https://")
      ? u
      : `https://${u}`);
}

function formatDateReadable(isoString: string) {
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
  const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(date);
  const split = formattedDate.split(" ").filter((word) => word !== "at");
  const [weekday, day, month, time] = split;

  if (date.toUTCString().slice(0, 16) === now.toUTCString().slice(0, 16)) {
    return `Today at ${time}`;
  }
  if (date > now && date < add(now, { days: 7 - now.getDay() })) {
    return `${weekday} at ${time}`;
  }
  return `${day} ${month} at ${time}`;
}

/* Truncated description with Show more / Show less */
function ExpandableText({
  text,
  maxChars = 160,
}: {
  text: string;
  maxChars?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span>—</span>;
  const needsClamp = text.length > maxChars;
  const shown =
    expanded || !needsClamp ? text : text.slice(0, maxChars).trimEnd() + "…";
  return (
    <div>
      <p className={`break-words ${expanded ? "whitespace-pre-wrap" : ""}`}>
        {shown}
      </p>
      {needsClamp && (
        <Button
          variant="link"
          size="sm"
          className="px-0"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}

/* ───────────────── Card-style, editable pub item ───────────────── */

function PubCardItem({
  pub,
  canEdit = true,
  deletePub,
  updatePub,
  venues,
  orgs,
  showMessage,
  myOrgId
}: {
  pub: Pub;
  canEdit?: boolean;
  venues: Venue[];
  orgs: Organization[];
  deletePub: (id: number) => void;
  updatePub: (pub: Pub) => void;
  showMessage: (text: string, type: "success" | "error") => void;
  myOrgId: number | undefined;
}) {
  const [editable, setEditable] = useState(false);
  const [editedPub, setEditedPub] = useState<Pub>(pub);

  const venueName = venues.find(
    (v) => v.id === (editable ? editedPub.venue_id : pub.venue_id),
  )?.name;
  const cohostName =
    ((editable ? editedPub.cohost_display_name : pub.cohost_display_name) ??
    (editable
      ? editedPub.co_host_organization_id
      : pub.co_host_organization_id))
      ? (orgs.find(
          (o) =>
            o.id ===
            (editable
              ? editedPub.co_host_organization_id
              : pub.co_host_organization_id),
        )?.display_name ??
        orgs.find(
          (o) =>
            o.id ===
            (editable
              ? editedPub.co_host_organization_id
              : pub.co_host_organization_id),
        )?.name)
      : undefined;

  const isEditable = canEdit && editable;

  const handleChange = <K extends keyof Pub>(field: K, value: Pub[K]) => {
    if (field === "date") {
      const v = value as Pub["date"];
      if (
        typeof v === "string" &&
        new Date(v) < new Date(new Date().setHours(0, 0, 0, 0))
      ) {
        showMessage("You cannot select a past date", "error");
        return;
      }
    }
    setEditedPub((prev) => ({ ...prev, [field]: value }));
  };

  const onNumberSelect = (field: "co_host_organization_id") => (val: string) => {
  if (val === "none") {
    handleChange(field, undefined as unknown as Pub["co_host_organization_id"]);
    return;
  }
  const numeric = Number(val);
  if (myOrgId !== null && numeric === myOrgId) {
    showMessage("You can’t select your own organization as co-host.", "error");
    return; 
  }
  handleChange(field, numeric as Pub["co_host_organization_id"]);
};

  const handleSave = () => {
    updatePub(editedPub);
    setEditable(false);
  };

  const handleCancel = () => {
    setEditedPub(pub);
    setEditable(false);
  };

  const fbLink = formatURL(
    (isEditable ? editedPub.fb_link : pub.fb_link) ?? "",
  );

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-gray-300 bg-gray-200 px-2.5 py-0.5 text-sm font-semibold text-primary shadow-sm">
                {formatDateReadable(pub.date)}
              </div>
              <SourceBadge auto_created={pub.auto_created} />
              {!!pub.patches && (
                <Badge className="bg-blue-600 text-white">Patches</Badge>
              )}
              {!canEdit && (
                <Badge variant="secondary" className="hidden sm:inline-block">
                  View only
                </Badge>
              )}
            </div>
            {/* Title display; input moved to details when editing */}
            <h3 className="mt-1 truncate text-lg font-semibold sm:text-xl">
              {isEditable ? editedPub.title : pub.title}
            </h3>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            {/* facebook button (view) */}
            {fbLink ? (
              <Button
                asChild
                size="sm"
                className="shrink-0 bg-[#1877F2] text-white hover:bg-[#166FE5]"
                disabled={isEditable}
                title={
                  isEditable ? "Finish editing to open" : "Open facebook link"
                }
              >
                <a href={fbLink} target="_blank" rel="noopener noreferrer">
                  facebook
                </a>
              </Button>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                No link
              </Badge>
            )}

            {canEdit && !isEditable && (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setEditable(true)}
                  title="Edit"
                >
                  <Pencil className="size-4" />
                </Button>
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
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}

            {canEdit && isEditable && (
              <>
                <Button
                  size="icon"
                  variant="default"
                  onClick={handleSave}
                  title="Save"
                >
                  <Save className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCancel}
                  title="Cancel"
                >
                  <X className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Date */}
          <div className="sm:col-span-4">
            <Label>Date</Label>
            <DateTimePicker
              date={
                (isEditable ? editedPub.date : pub.date)
                  ? new Date(isEditable ? editedPub.date : pub.date)
                  : undefined
              }
              setDate={(d) => handleChange("date", d?.toISOString() || "")}
              disabled={!isEditable}
            />
          </div>

          {/* Title (input only when editing) */}
          <div className="sm:col-span-8">
            <Label htmlFor={`title-${pub.id}`}>Title</Label>
            <Input
              id={`title-${pub.id}`}
              value={isEditable ? editedPub.title : pub.title}
              disabled={!isEditable}
              onChange={(e) => handleChange("title", e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Venue */}
          <div className="sm:col-span-4">
            <Label>Venue</Label>
            <Select
              value={(isEditable
                ? editedPub.venue_id
                : pub.venue_id
              ).toString()}
              onValueChange={(v) => handleChange("venue_id", Number(v))}
              disabled={!isEditable}
            >
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
            {!isEditable && venueName && (
              <div className="mt-1 text-xs text-muted-foreground">
                Current: {venueName}
              </div>
            )}
          </div>

          {/* Co-host */}
          <div className="sm:col-span-4">
            <Label>Co-host (optional)</Label>
            <Select
              value={
                (isEditable
                  ? editedPub.co_host_organization_id
                  : pub.co_host_organization_id) == undefined
                  ? "none"
                  : String(
                      isEditable
                        ? editedPub.co_host_organization_id
                        : pub.co_host_organization_id,
                    )
              }
              onValueChange={onNumberSelect("co_host_organization_id")}
              disabled={!isEditable}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select co-host" />
              </SelectTrigger>
              <SelectContent>
  <SelectItem value="none">No co-host</SelectItem>
  {orgs.map((o) => {
    const isSelf = myOrgId !== null && o.id === myOrgId;
    return (
      <SelectItem key={o.id} value={o.id.toString()} disabled={isSelf}>
        {(o.display_name ?? o.name) + (isSelf ? " (your org)" : "")}
      </SelectItem>
    );
  })}
</SelectContent>
            </Select>
            {!isEditable && (
              <div className="mt-1 text-xs text-muted-foreground">
                Current: {cohostName ?? "—"}
              </div>
            )}
          </div>

          {/* Patches */}
          <div className="sm:col-span-4">
            <Label htmlFor={`sellPatches-${pub.id}`}>Patches offered?</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3">
              <Switch
                id={`sellPatches-${pub.id}`}
                checked={isEditable ? editedPub.patches : pub.patches}
                disabled={!isEditable}
                onCheckedChange={(checked) => handleChange("patches", checked)}
              />
              {!isEditable && (
                <span className="text-sm">{pub.patches ? "Yes" : "No"}</span>
              )}
            </div>
          </div>

          {/* Event Link (edit only; view uses the facebook button in header) */}
          {isEditable && (
            <div className="sm:col-span-12">
              <Label htmlFor={`event-link-${pub.id}`}>Event Link</Label>
              <Input
                id={`event-link-${pub.id}`}
                value={editedPub.fb_link ?? ""}
                disabled={!isEditable}
                onChange={(e) => handleChange("fb_link", e.target.value)}
                className="bg-white"
              />
            </div>
          )}

          {/* Description */}
          <div className="sm:col-span-12">
            <Label>Description</Label>
            {isEditable ? (
              <Textarea
                placeholder="Enter description..."
                value={editedPub.description}
                disabled={!isEditable}
                onChange={(e) =>
                  handleChange("description", e.target.value.slice(0, 2000))
                }
                className="w-full bg-white"
                rows={4}
              />
            ) : (
              <ExpandableText text={pub.description} maxChars={160} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────── Page ───────────────── */

export default function Page() {
  const [pubs, setpubs] = useState<Pub[]>([]);
  const [cohostPubs, setCohostPubs] = useState<Pub[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sellPatches, setSellPatches] = useState(false);
  const [date, setDate] = React.useState<Date>();
  const [event_link, setEventLink] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venueId, setVenueId] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cohostOrgId, setCohostOrgId] = useState<string>("none");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [myOrgId, setMyOrgId] = useState<number | undefined>();
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  }>();

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(undefined), 3000);
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

  // Fetch pubs + lookups
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
        const data: Pub[] = await response.json();
        setpubs(
          data.map((pub) => ({
            ...pub,
            fb_link: pub.fb_link ?? "",
            auto_created: !!pub.auto_created,
          })),
        );
      } catch (error: unknown) {
        if (error instanceof Error)
          setMessage({ text: error.message, type: "error" });
        else setMessage({ text: "An unknown error occurred", type: "error" });
      }
    }
    fetchPubs();

    async function fetchCohostPubs() {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/events/getUpcomingCohost`;
        const res = await fetch(url, { method: "GET", credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch co-hosted pubs");
        const data: Pub[] = await res.json();
        setCohostPubs(
          data.map((pub) => ({
            ...pub,
            fb_link: pub.fb_link ?? "",
            auto_created: !!pub.auto_created,
          })),
        );
      } catch (error) {
        setMessage({
          text: "Failed to fetch co-hosted pubs " + error,
          type: "error",
        });
      }
    }
    fetchCohostPubs();

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
        if (error instanceof Error)
          setMessage({ text: error.message, type: "error" });
        else setMessage({ text: "An unknown error occurred", type: "error" });
      }
    }
    fetchVenues();

    async function fetchOrganizations() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (!res.ok) throw new Error("Failed to fetch organizations");
        const data: Organization[] = await res.json();
        const normalized: Organization[] = data.map((o) => ({
          id: o.id,
          name: o.name,
          display_name: o.display_name ?? o.name,
        }));
        setOrgs(normalized);
      } catch (error) {
        setMessage({
          text: "Failed to fetch organizations " + error,
          type: "error",
        });
      }
    }
    fetchOrganizations();

    const fetchDefaultVenue = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/venue`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) throw new Error("Failed to fetch default venue");
        const data = await response.json();
        setVenueId(data.venueId.toString());
        setMyOrgId(Number(data.organization_id));
      } catch (error: unknown) {
        if (error instanceof Error)
          setMessage({ text: error.message, type: "error" });
        else setMessage({ text: "An unknown error occurred", type: "error" });
      }
    };
    fetchDefaultVenue();
  }, []);

  // Add pub
  const addpub = async () => {
    if (!eventTitle || !date) {
      showMessage("Please provide at least title and date", "error");
      return;
    }
    const formated_event_link = formatURL(event_link);
    const localDate = toZonedTime(date, "Europe/Stockholm");
    const formattedDate = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");

    const chosenCohostId =
      cohostOrgId === "none" ? undefined : Number(cohostOrgId);

    if (myOrgId !== null && chosenCohostId === myOrgId) {
      showMessage("You can’t select your own organization as co-host.", "error");
      return;
    }

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
            event_link:
              formated_event_link === "" ? undefined : formated_event_link,
            location: location,
            venue_id: venueId,
            description: description,
            patches: sellPatches,
            co_host_organization_id: chosenCohostId
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 409 ? "pub already exists" : "Failed to add pub",
        );
      }

      const newpub = await response.json();
      setpubs([...pubs, newpub.event]);
      showMessage("pub added successfully!", "success");
    } catch (error: unknown) {
      if (error instanceof Error)
        setMessage({ text: error.message, type: "error" });
      else setMessage({ text: "An unknown error occurred", type: "error" });
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
      if (error instanceof Error)
        setMessage({ text: error.message, type: "error" });
      else setMessage({ text: "An unknown error occurred", type: "error" });
    }
  };

  const updatePub = async (pub: Pub) => {
    const localDate = toZonedTime(pub.date, "Europe/Stockholm");
    const formattedDate = format(localDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
    const formatted_event_link = formatURL(pub.fb_link);

    if (myOrgId !== null && pub.co_host_organization_id === myOrgId) {
  showMessage("You can’t select your own organization as co-host.", "error");
  return;
}

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
            event_link:
              formatted_event_link === "" ? undefined : formatted_event_link,
            venue_id: pub.venue_id,
            description: pub.description,
            patches: pub.patches,
            co_host_organization_id:
              pub.co_host_organization_id == undefined
                ? undefined
                : Number(pub.co_host_organization_id),
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
      if (error instanceof Error)
        setMessage({ text: error.message, type: "error" });
      else setMessage({ text: "An unknown error occurred", type: "error" });
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

        {/* Create form */}
        <div className="p-4">
          <div className="w/full mb-4 grid max-w-[1200px] grid-cols-1 gap-4 rounded-lg border bg-secondary p-4 shadow-sm md:grid-cols-12">
            {/* Date Picker */}
            <div className="col-span-12 md:col-span-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start truncate text-left font-normal",
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
            </div>

            {/* Title */}
            <div className="col-span-12 md:col-span-8">
              <Input
                placeholder="Enter title..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full bg-white text-center font-semibold"
              />
            </div>

            <div className="col-span-12 md:col-span-4">
              <Select value={venueId} onValueChange={setVenueId}>
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

            {/* Co-host */}
            <div className="col-span-12 md:col-span-4">
  <Select
    value={cohostOrgId}
    onValueChange={(val) => {
      if (val !== "none" && myOrgId !== null && Number(val) === myOrgId) {
        setCohostOrgId("none");
        showMessage("You can’t select your own organization as co-host.", "error");
        return;
      }
      setCohostOrgId(val);
    }}
  >
    <SelectTrigger className="w-full bg-white">
      <SelectValue placeholder="Select co-host (optional)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">No co-host</SelectItem>
      {orgs.map((o) => {
        const isSelf = myOrgId !== null && o.id === myOrgId;
        return (
          <SelectItem key={o.id} value={o.id.toString()} disabled={isSelf}>
            {(o.display_name ?? o.name) + (isSelf ? " (your org)" : "")}
          </SelectItem>
        );
      })}
    </SelectContent>
  </Select>
</div>


            {/* Patches offered? */}
            <div className="col-span-12 md:col-span-4">
              <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3">
                <Label
                  htmlFor="sellPatches"
                  className="text-sm text-muted-foreground"
                >
                  Patches offered?
                </Label>
                <Switch
                  id="sellPatches"
                  checked={sellPatches}
                  onCheckedChange={setSellPatches}
                />
              </div>
            </div>

            {/* Event Link — FULL WIDTH */}
            <div className="col-span-12 min-w-0">
              <Input
                placeholder="Enter event link..."
                value={event_link}
                onChange={(e) => setEventLink(e.target.value)}
                className="w-full bg-white"
              />
            </div>

            {/* Description */}
            <div className="col-span-12">
              <Textarea
                placeholder="Enter description..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                className="w-full bg-white"
                rows={4}
              />
            </div>

            {/* Submit */}
            <div className="col-span-12">
              <Button variant="default" onClick={addpub} className="w-full">
                <PlusIcon className="mr-2 size-5" />
                Add Event
              </Button>
            </div>
          </div>

          {/* List of pubs (cards) */}
          <div className="mt-4 w-full max-w-[1200px] space-y-3">
            {pubs.length === 0 ? (
              <p className="text-[hsl(var(--muted-foreground))]">
                No pubs available.
              </p>
            ) : (
              pubs.map((pub) => (
                <PubCardItem
                  key={pub.id}
                  pub={pub}
                  canEdit={true}
                  deletePub={deletePub}
                  updatePub={updatePub}
                  showMessage={showMessage}
                  venues={venues}
                  orgs={orgs}
                  myOrgId={myOrgId}
                />
              ))
            )}

            {cohostPubs.length > 0 && (
              <>
                <h2 className="mb-1 mt-6 text-sm font-semibold text-gray-700">
                  Co-hosted (view only)
                </h2>
                {cohostPubs.map((pub) => (
                  <PubCardItem
                    key={`co-${pub.id}`}
                    pub={pub}
                    canEdit={false}
                    deletePub={deletePub}
                    updatePub={updatePub}
                    showMessage={showMessage}
                    venues={venues}
                    orgs={orgs}
                    myOrgId={myOrgId}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
