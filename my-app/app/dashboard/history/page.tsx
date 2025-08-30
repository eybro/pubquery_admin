"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { add } from "date-fns";
import { SourceBadge } from "@/components/source-badge";

const PAST_PUBS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/events/getPast`;
const PAST_PUBS_COHOST_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/events/getPastCohost`;
const VENUES_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/venues`;
const ORGS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`;
const PAGE_LIMIT = 10;

type Pub = {
  id: number;
  title: string;
  date: string;
  auto_created: number;
  fb_link: string;
  venue_id: number;
  description: string;
  patches: boolean;
  co_host_organization_id?: number | undefined;
  cohost_display_name?: string | undefined;
};

type Venue = { id: number; name: string };
type Organization = { id: number; name: string; display_name?: string };

type CursorResponse<T> = { items: T[]; nextCursor: number | undefined } | T[];

function normalizeCursorResp<T>(data: CursorResponse<T>): {
  items: T[];
  nextCursor?: number;
} {
  if (Array.isArray(data)) return { items: data, nextCursor: undefined };
  return { items: data.items, nextCursor: data.nextCursor ?? undefined };
}

function formatDate(isoString: string) {
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
  const [weekday, day, month, time] = formattedDate
    .split(" ")
    .filter((w) => w !== "at");
  if (date.toUTCString().slice(0, 16) === now.toUTCString().slice(0, 16))
    return `Today at ${time}`;
  if (date > now && date < add(now, { days: 7 - now.getDay() }))
    return `${weekday} at ${time}`;
  return `${day} ${month} at ${time}`;
}

function formatURL(url?: string | undefined): string {
  if (!url || typeof url !== "string") return "";
  const u = url.trim();
  return u === ""
    ? ""
    : (u.startsWith("http://") || u.startsWith("https://")
      ? u
      : `https://${u}`);
}

/* --- 2) Expandable description --- */
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

function PastPubCard({
  pub,
  venueName,
  cohostName,
}: {
  pub: Pub;
  venueName?: string;
  cohostName?: string | undefined;
}) {
  const link = formatURL(pub.fb_link);

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-gray-300 bg-gray-200 px-2.5 py-0.5 text-sm font-semibold text-primary shadow-sm">
                {formatDate(pub.date)}
              </div>
              <SourceBadge auto_created={pub.auto_created} />
              {!!pub.patches && (
                <Badge className="bg-blue-600 text-white">Patches</Badge>
              )}
            </div>
            <h3 className="mt-1 truncate text-lg font-semibold sm:text-xl">
              {pub.title}
            </h3>
          </div>

          {/* 3) Facebook-styled button (brand blue + icon) */}
          {link ? (
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-[#1877F2] font-bold text-white hover:bg-[#166FE5]"
            >
              <a href={link} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </Button>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              No link
            </Badge>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <div className="text-xs text-muted-foreground">Venue</div>
            <div className="font-medium">{venueName ?? `#${pub.venue_id}`}</div>
          </div>

          <div className="sm:col-span-4">
            <div className="text-xs text-muted-foreground">Co-host</div>
            <div className="font-medium">
              {cohostName ||
                (pub.co_host_organization_id
                  ? `#${pub.co_host_organization_id}`
                  : "—")}
            </div>
          </div>

          <div className="sm:col-span-4">
            <div className="text-xs text-muted-foreground">Patches offered</div>
            <div className="font-medium">{pub.patches ? "Yes" : "No"}</div>
          </div>

          <div className="sm:col-span-12">
            <div className="text-xs text-muted-foreground">Description</div>
            <ExpandableText text={pub.description || ""} maxChars={160} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PastPubsPage() {
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  }>();
  const [refreshing, setRefreshing] = useState(false);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  const [pubs, setPubs] = useState<Pub[]>([]);
  const [pubsLoading, setPubsLoading] = useState(true);
  const [pubsCursor, setPubsCursor] = useState<
    number | undefined | undefined
  >();

  const [cohostPubs, setCohostPubs] = useState<Pub[]>([]);
  const [cohostLoading, setCohostLoading] = useState(true);
  const [cohostCursor, setCohostCursor] = useState<
    number | undefined | undefined
  >();

  const [search, setSearch] = useState("");

  // prevent double initial fetch under React 18 Strict Mode
  const didInitRef = useRef(false);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(undefined), 3000);
  };

  const venueNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const v of venues) m.set(v.id, v.name);
    return m;
  }, [venues]);

  const orgNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const o of orgs) m.set(o.id, o.display_name ?? o.name);
    return m;
  }, [orgs]);

  const fetchVenues = useCallback(async () => {
    try {
      const res = await fetch(VENUES_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch venues");
      const data: Venue[] = await res.json();
      setVenues(data);
    } catch (error) {
      showMessage("Failed to fetch venues " + error, "error");
    }
  }, []);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch(ORGS_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch organizations");
      const raw: Organization[] = await res.json();

      const data: Organization[] = raw.map((o) => ({
        id: o.id,
        name: o.name,
        display_name: o.display_name ?? o.name,
      }));
      setOrgs(data);
    } catch (error) {
      showMessage("Failed to fetch orgs" + error, "error");
    }
  }, []);

  // 1) Load-more fix: stable initial fetch + robust cursor handling
  const fetchPastPubs = useCallback(
    async (next?: boolean) => {
      if (next && pubsCursor === undefined) return; // end reached
      if (!next) setPubsLoading(true);

      try {
        const url = new URL(PAST_PUBS_URL);
        url.searchParams.set("limit", String(PAGE_LIMIT));

        // use server nextCursor when available, otherwise fallback to current length
        const offset = next
          ? (typeof pubsCursor === "number"
            ? pubsCursor
            : pubs.length)
          : 0;
        if (next) url.searchParams.set("cursor", String(offset));

        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch past pubs");
        const data: CursorResponse<Pub> = await res.json();

        const { items, nextCursor } = normalizeCursorResp(
          Array.isArray(data)
            ? (data as Pub[]).map((p) => ({ ...p, fb_link: p.fb_link ?? "" }))
            : {
                items: (
                  data as { items: Pub[]; nextCursor: number | undefined }
                ).items.map((p) => ({
                  ...p,
                  fb_link: p.fb_link ?? "",
                })),
                nextCursor: (
                  data as { items: Pub[]; nextCursor: number | undefined }
                ).nextCursor,
              },
        );

        if (next) setPubs((prev) => [...prev, ...items]);
        else setPubs(items);

        // compute next cursor even if API didn't return one
        const computedNext =
          typeof nextCursor === "number"
            ? nextCursor
            : (items.length < PAGE_LIMIT
              ? undefined
              : offset + PAGE_LIMIT);

        setPubsCursor(computedNext);
      } catch (error) {
        showMessage("Failed to fetch past pubs " + error, "error");
      } finally {
        if (!next) setPubsLoading(false);
      }
    },
    [pubsCursor, pubs.length],
  );

  const fetchPastCohost = useCallback(
    async (next?: boolean) => {
      if (next && cohostCursor === undefined) return;
      if (!next) setCohostLoading(true);

      try {
        const url = new URL(PAST_PUBS_COHOST_URL);
        url.searchParams.set("limit", String(PAGE_LIMIT));

        const offset = next
          ? (typeof cohostCursor === "number"
            ? cohostCursor
            : cohostPubs.length)
          : 0;
        if (next) url.searchParams.set("cursor", String(offset));

        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch co-hosted past pubs");

        const data: CursorResponse<Pub> = await res.json();
        const { items, nextCursor } = normalizeCursorResp(
          Array.isArray(data)
            ? (data as Pub[]).map((p) => ({ ...p, fb_link: p.fb_link ?? "" }))
            : {
                items: (
                  data as { items: Pub[]; nextCursor: number | undefined }
                ).items.map((p) => ({
                  ...p,
                  fb_link: p.fb_link ?? "",
                })),
                nextCursor: (
                  data as { items: Pub[]; nextCursor: number | undefined }
                ).nextCursor,
              },
        );

        if (next) setCohostPubs((prev) => [...prev, ...items]);
        else setCohostPubs(items);

        const computedNext =
          typeof nextCursor === "number"
            ? nextCursor
            : (items.length < PAGE_LIMIT
              ? undefined
              : offset + PAGE_LIMIT);

        setCohostCursor(computedNext);
      } catch (error) {
        showMessage("Failed to fetch past co-host pubs " + error, "error");
      } finally {
        if (!next) setCohostLoading(false);
      }
    },
    [cohostCursor, cohostPubs.length],
  );

  // Initial fetch (run once, not whenever callbacks change)
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    (async () => {
      await Promise.all([fetchVenues(), fetchOrgs()]);
      await Promise.all([fetchPastPubs(), fetchPastCohost()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pubs;
    return pubs.filter((p) => {
      const venue = venueNameById.get(p.venue_id) ?? "";
      const cohost =
        p.cohost_display_name ??
        (p.co_host_organization_id
          ? (orgNameById.get(p.co_host_organization_id) ?? "")
          : "");
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        venue.toLowerCase().includes(q) ||
        cohost.toLowerCase().includes(q)
      );
    });
  }, [pubs, search, venueNameById, orgNameById]);

  const filteredCohost = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cohostPubs;
    return cohostPubs.filter((p) => {
      const venue = venueNameById.get(p.venue_id) ?? "";
      const cohost =
        p.cohost_display_name ??
        (p.co_host_organization_id
          ? (orgNameById.get(p.co_host_organization_id) ?? "")
          : "");
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        venue.toLowerCase().includes(q) ||
        cohost.toLowerCase().includes(q)
      );
    });
  }, [cohostPubs, search, venueNameById, orgNameById]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {message && (
          <div
            className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-2 text-white shadow-lg ${
              message.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Past Pubs</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, venue, co-host…"
              className="h-9 w-56"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setRefreshing(true);
                setPubs([]);
                setCohostPubs([]);
                setPubsCursor(undefined);
                setCohostCursor(undefined);
                await Promise.all([
                  fetchPastPubs(),
                  fetchPastCohost(),
                  fetchVenues(),
                  fetchOrgs(),
                ]);
                setRefreshing(false);
              }}
            >
              <RefreshCw className="mr-2 size-4" />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 md:p-8">
          {/* Your past pubs */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your pubs</h2>
            </div>

            {pubsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (filteredPubs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No past pubs match your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPubs.map((p) => (
                  <PastPubCard
                    key={p.id}
                    pub={p}
                    venueName={venueNameById.get(p.venue_id)}
                    cohostName={
                      p.cohost_display_name ??
                      (p.co_host_organization_id
                        ? (orgNameById.get(p.co_host_organization_id) ??
                          undefined)
                        : undefined)
                    }
                  />
                ))}
              </div>
            ))}

            <div className="mt-3 flex items-center justify-center">
              {!pubsLoading && pubsCursor === undefined ? (
                <div className="text-xs text-muted-foreground">
                  No more items
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPastPubs(true)}
                >
                  Load more
                </Button>
              )}
            </div>
          </section>

          {/* Co-hosted past pubs */}
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Co-hosted (view only)</h2>
            </div>

            {cohostLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (filteredCohost.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No co-hosted past pubs match your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCohost.map((p) => (
                  <PastPubCard
                    key={`co-${p.id}`}
                    pub={p}
                    venueName={venueNameById.get(p.venue_id)}
                    cohostName={
                      p.cohost_display_name ??
                      (p.co_host_organization_id
                        ? (orgNameById.get(p.co_host_organization_id) ??
                          undefined)
                        : undefined)
                    }
                  />
                ))}
              </div>
            ))}

            <div className="mt-3 flex items-center justify-center">
              {!cohostLoading && cohostCursor === undefined ? (
                <div className="text-xs text-muted-foreground">
                  No more items
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPastCohost(true)}
                >
                  Load more
                </Button>
              )}
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
