"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, BarChart3, CalendarClock, AlertCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// --- Endpoints ---
const PAST_PUBS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/events/getPast`;
const PAST_PUBS_COHOST_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/events/getPastCohost`;
const SNAPSHOTS_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/stats/snapshots`;

// --- Timezone for labels ---
const TZ = "Europe/Stockholm";

// --- Chart layout constants ---
const CHART_MARGIN = { top: 24, right: 56, bottom: 36, left: 8 } as const;
/** Reserve the same Y-axis label width in BOTH charts so their plot areas align */
const Y_AXIS_WIDTH = 42; // tweak if your labels are wider on other datasets

// --- Types ---
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

type LineLen = "short" | "medium" | "long" | "no_line" | undefined;

type Snapshot = {
  venue_id: number;
  captured_at: string; // UTC (may be "YYYY-MM-DD HH:mm:ss" without Z)
  member_count: number;
  non_member_count: number;
  total_count: number;
  occupancy_pct: number | undefined;
  line_length: LineLen;
  max_capacity?: number | undefined;
};

type Point = {
  tsMs: number;   // epoch ms (UTC instant)
  total: number;
  members: number;
  nonMembers: number;
  lineLen: LineLen;
  maxCapacity?: number | undefined;
};

type Segment = {
  x1: number; // start ms
  x2: number; // end ms
  kind: "short" | "medium" | "long";
};

// --- Utils ---
function stockholmWallTimeToUTCISO(d: Date): string {
  const naive = formatInTimeZone(d, TZ, "yyyy-MM-dd'T'HH:mm:ss");
  return fromZonedTime(naive, TZ).toISOString();
}
function to03NextDayWindowStockholm(startLocalISO: string) {
  const start = new Date(startLocalISO);
  const nextDay03Str = formatInTimeZone(
    new Date(start.getTime() + 24 * 60 * 60 * 1000),
    TZ,
    "yyyy-MM-dd'T'03:00:00"
  );
  const endUtcInstant = fromZonedTime(nextDay03Str, TZ);
  return { start, end: endUtcInstant };
}
// Robust UTC parser (treat "YYYY-MM-DD HH:mm:ss" as UTC)
// Robust UTC parser (treat "YYYY-MM-DD HH:mm:ss" as UTC)
function parseCapturedAtUTC(v: string | Date): Date {
  if (v instanceof Date) return v;
  const s = (v || "").trim();
  if (!s) return new Date(Number.NaN);

  // Has explicit timezone: trailing 'Z' or '+HH:MM' / '-HH:MM'
  if (/z$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s);
  }

  // MySQL DATETIME-like → interpret as UTC
  const iso = s.replace(" ", "T");
  return new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
}

// --- Colors: Total = blue, Members = teal, Non-members = orange
const COL_TOTAL = "#2563eb";
const COL_MEM   = "#14b8a6";
const COL_NON   = "#f97316";
// Queue timeline colors
const COL_Q_SHORT = "#10b981";
const COL_Q_MED   = "#f59e0b";
const COL_Q_LONG  = "#ef4444";

export default function PubVisitorStatisticsPage() {
  // Left: list & selector
  const [pubs, setPubs] = useState<Pub[] | undefined>([]);
  const [cohostPubs, setCohostPubs] = useState<Pub[] | undefined>([]);
  const [loadingPubs, setLoadingPubs] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Pub>();

  // Right: chart data
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [error, setError] = useState<string>();

  const didInit = useRef(false);

  // Fetch past pubs
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      try {
        setLoadingPubs(true);
        const [a, b] = await Promise.all([
          fetch(PAST_PUBS_URL, { credentials: "include" }),
          fetch(PAST_PUBS_COHOST_URL, { credentials: "include" }),
        ]);
        if (!a.ok) throw new Error("Failed to fetch past pubs");
        if (!b.ok) throw new Error("Failed to fetch cohost pubs");
        const rawOwn = await a.json();
        const rawCo = await b.json();
        const own = Array.isArray(rawOwn.items) ? (rawOwn.items as Pub[]) : (rawOwn as Pub[]);
        const co = Array.isArray(rawCo.items) ? (rawCo.items as Pub[]) : (rawCo as Pub[]);
        setPubs(own);
        setCohostPubs(co);
        setSelected((own?.[0] ?? co?.[0]) ?? undefined);
      } catch (error) {
        setError(String(error));
      } finally {
        setLoadingPubs(false);
      }
    })();
  }, []);

  // Window [startLocal, 03:00 next day) in Stockholm
  const { startLocal, endLocal } = useMemo(() => {
    if (!selected) return { startLocal: undefined as Date | undefined, endLocal: undefined as Date | undefined };
    const { start, end } = to03NextDayWindowStockholm(selected.date);
    return { startLocal: start, endLocal: end };
  }, [selected]);

  // Fetch snapshots
  const fetchSnapshots = useCallback(async () => {
    if (!selected) return;
    setLoadingSnaps(true);
    setError(undefined);
    try {
      const params = new URLSearchParams({
        venue_id: String(selected.venue_id),
        from: startLocal ? stockholmWallTimeToUTCISO(startLocal) : "",
        to: endLocal ? stockholmWallTimeToUTCISO(endLocal) : "",
      });
      const res = await fetch(`${SNAPSHOTS_URL}?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch counter snapshots");
      const data: Snapshot[] = await res.json();
      setSnapshots(data);
    } catch (error) {
        setError(String(error));
    } finally {
      setLoadingSnaps(false);
    }
  }, [selected, startLocal, endLocal]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Filter list by search
  const list = useMemo(() => {
    const all = [...(pubs ?? []), ...(cohostPubs ?? [])];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [pubs, cohostPubs, search]);

  // Transform snapshots -> chart points
  const points = useMemo<Point[]>(() => {
    return (snapshots ?? []).map((s) => {
      const dUTC = parseCapturedAtUTC(s.captured_at);
      const total = s.total_count ?? (s.member_count + s.non_member_count);
      return {
        tsMs: dUTC.getTime(),
        total,
        members: s.member_count,
        nonMembers: s.non_member_count,
        lineLen: (s.line_length ?? "no_line") as LineLen,
        maxCapacity: s.max_capacity ?? undefined,
      };
    });
  }, [snapshots]);

  // Shared X domain for perfect alignment
  const xDomain = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 1 };
    return { min: points[0].tsMs, max: points.at(-1)?.tsMs ?? points[0].tsMs };
  }, [points]);

  // Queue-length segments (clamped to domain)
  const segments = useMemo<Segment[]>(() => {
    const segs: Segment[] = [];
    if (points.length === 0) return segs;
    let i = 0;
    while (i < points.length) {
      const kind = points[i].lineLen;
      if (kind === "short" || kind === "medium" || kind === "long") {
        let x1 = points[i].tsMs;
        let j = i + 1;
        while (j < points.length && points[j].lineLen === kind) j++;
        let x2 = j < points.length ? points[j].tsMs : xDomain.max;
        x1 = Math.max(x1, xDomain.min);
        x2 = Math.min(x2, xDomain.max);
        if (x2 > x1) segs.push({ x1, x2, kind });
        i = j;
      } else {
        i++;
      }
    }
    return segs;
  }, [points, xDomain]);

  // Y axis domain (+10% headroom)
  const { maxCapacity, peakTotal } = useMemo(() => {
    const cap = Math.max(
      -Infinity,
      ...points.map((p) => (p.maxCapacity == undefined ? -Infinity : Number(p.maxCapacity)))
    );
    return {
      maxCapacity: Number.isFinite(cap) && cap > 0 ? cap : undefined,
      peakTotal: Math.max(0, ...points.map((p) => p.total || 0)),
    };
  }, [points]);

  const yMax = useMemo(() => {
    const base = maxCapacity == undefined ? Math.max(10, peakTotal) : maxCapacity;
    const padded = Math.ceil(base * 1.1);
    return Math.max(base + 1, padded);
  }, [maxCapacity, peakTotal]);

  // Summary cards
  const nightStats = useMemo(() => {
    if (points.length === 0) {
      return {
        count: 0,
        hoursCovered: 0,
        peakTotal: 0,
        avgOcc: 0,
        ratioMembersPct: 0,
        ratioNonMembersPct: 0,
      };
    }
    // last non-zero total
    let lastIdx = points.length - 1;
    for (let i = points.length - 1; i >= 0; i--) {
      if ((points[i].total ?? 0) > 0) { lastIdx = i; break; }
    }
    const slice = points.slice(0, Math.max(0, lastIdx + 1));

    const avgOccVals = slice
      .map((_p, i) => Number((snapshots[i]).occupancy_pct))
      .filter((x) => Number.isFinite(x));
    const avgOcc = avgOccVals.length > 0
      ? Math.round((avgOccVals.reduce((a, b) => a + b, 0) / avgOccVals.length) * 10) / 10
      : 0;

    const endBoundaryMs = slice.at(-1)?.tsMs ?? xDomain.max;
    let wMembers = 0, wNon = 0;
    for (let i = 0; i < slice.length; i++) {
      const cur = slice[i];
      const nextStart = i < slice.length - 1 ? slice[i + 1].tsMs : endBoundaryMs;
      const dt = Math.max(0, nextStart - cur.tsMs);
      if (dt > 0) {
        wMembers += cur.members * dt;
        wNon += cur.nonMembers * dt;
      }
    }
    const sum = wMembers + wNon;
    const ratioMembersPct = sum > 0 ? Math.round((wMembers / sum) * 100) : 0;
    const ratioNonMembersPct = sum > 0 ? Math.round((wNon / sum) * 100) : 0;

    const hoursSet = new Set(slice.map((p) => Number(formatInTimeZone(p.tsMs, TZ, "HH"))));
    return {
      count: slice.length,
      hoursCovered: hoursSet.size,
      peakTotal: Math.max(0, ...slice.map((p) => p.total || 0)),
      avgOcc,
      ratioMembersPct,
      ratioNonMembersPct,
    };
  }, [points, snapshots, xDomain.max]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <BarChart3 className="size-5" /> Visitor statistics
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Button variant="outline" size="sm" onClick={() => fetchSnapshots()}>
              <RefreshCw className="mr-2 size-4" /> Refresh
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:p-6 lg:p-8">
          {/* Left selector */}
          <Card className="rounded-2xl md:col-span-4 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Select a past pub</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search title/description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-4" /> Showing {list.length} items
              </div>
              {loadingPubs ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[60vh] rounded-md border">
                  <div className="p-2">
                    {list.map((p) => (
                      <button
                        key={`${p.id}`}
                        onClick={() => setSelected(p)}
                        className={`mb-1 w-full rounded-lg px-3 py-2 text-left transition hover:bg-accent ${
                          selected?.id === p.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate font-medium">{p.title}</div>
                          {p.patches ? (
                            <Badge variant="secondary">Patches</Badge>
                          ) : undefined}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatInTimeZone(new Date(p.date), TZ, "dd MMM HH:mm")}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right chart */}
          <Card className="rounded-2xl md:col-span-8 lg:col-span-9">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {selected ? selected.title : "Select a pub"}
                  </CardTitle>
                  {selected && (
                    <div className="text-xs text-muted-foreground">
                      Window (Stockholm):{" "}
                      {startLocal
                        ? formatInTimeZone(new Date(startLocal), TZ, "yyyy-MM-dd HH:mm")
                        : ""}{" "}
                      →{" "}
                      {endLocal
                        ? formatInTimeZone(new Date(endLocal), TZ, "yyyy-MM-dd HH:mm")
                        : ""}{" "}
                      (to 03:00 next day)
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#2563eb]">Total</Badge>
                  <Badge className="bg-[#14b8a6]">Members</Badge>
                  <Badge className="bg-[#f97316]">Non-members</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                  <AlertCircle className="size-4" /> {error}
                </div>
              )}
              {loadingSnaps ? (
                <Skeleton className="h-[380px] w-full" />
              ) : (selected ? (
                <>
                  {/* Main chart */}
                  <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={points} margin={CHART_MARGIN} syncId="queue-sync">
                        <defs>
                          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COL_TOTAL} stopOpacity={0.5} />
                            <stop offset="95%" stopColor={COL_TOTAL} stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="fillMembers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COL_MEM} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={COL_MEM} stopOpacity={0.08} />
                          </linearGradient>
                          <linearGradient id="fillNon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COL_NON} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={COL_NON} stopOpacity={0.08} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" opacity={0.35} />

                        <XAxis
                          type="number"
                          dataKey="tsMs"
                          domain={[xDomain.min, xDomain.max]}
                          scale="time"
                          padding={{ left: 0, right: 0 }}
                          tickFormatter={(ms: number) => formatInTimeZone(ms, TZ, "HH:mm")}
                          tick={{ fontSize: 12 }}
                          tickMargin={8}
                        />

                        <YAxis
                          width={Y_AXIS_WIDTH}            // <-- fixed width
                          tick={{ fontSize: 12 }}
                          domain={[0, yMax]}
                          allowDecimals={false}
                        />

                        <Tooltip
                          wrapperStyle={{ outline: "none" }}
                          contentStyle={{ borderRadius: 12 }}
                          labelFormatter={(ms: number) =>
                            `Time (Stockholm): ${formatInTimeZone(ms, TZ, "HH:mm")}`
                          }
                          formatter={(val: number | string, name: string) => [val, name]}
                        />

                        <Area
                          type="monotone"
                          dataKey="total"
                          name="Total"
                          fill="url(#fillTotal)"
                          stroke={COL_TOTAL}
                          strokeWidth={2.8}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                          isAnimationActive={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="members"
                          name="Members"
                          fill="url(#fillMembers)"
                          stroke={COL_MEM}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="nonMembers"
                          name="Non-members"
                          fill="url(#fillNon)"
                          stroke={COL_NON}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />

                        {maxCapacity != undefined && (
                          <ReferenceLine
                            y={maxCapacity}
                            ifOverflow="extendDomain"
                            stroke="#ef4444"
                            strokeDasharray="6 6"
                            label={{
                              value: `Max capacity (${maxCapacity})`,
                              position: "insideTopRight",
                              fontSize: 12,
                            }}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Queue-length timeline — perfectly aligned tiny chart */}
                  {segments.length > 0 && (
                    <div className="mt-2 h-3 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={points}
                          margin={{ ...CHART_MARGIN, top: 0, bottom: 0 }}
                          syncId="queue-sync"
                        >
                          <XAxis
                            type="number"
                            dataKey="tsMs"
                            domain={[xDomain.min, xDomain.max]}
                            scale="time"
                            padding={{ left: 40, right: 0 }}
                            hide
                          />
                          <YAxis type="number" domain={[0, 1]} width={100} hide />{/* <-- same width */}
                          {segments.map((seg, idx) => (
                            <ReferenceArea
                              key={idx}
                              x1={seg.x1}
                              x2={seg.x2}
                              y1={0}
                              y2={1}
                              ifOverflow="hidden"   // no domain extension
                              fill={
                                seg.kind === "short"
                                  ? COL_Q_SHORT
                                  : (seg.kind === "medium"
                                  ? COL_Q_MED
                                  : COL_Q_LONG)
                              }
                              fillOpacity={1}
                              stroke="none"
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Legend for the queue timeline */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">Queue length:</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-6 rounded-sm" style={{ background: COL_Q_SHORT }} /> short
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-6 rounded-sm" style={{ background: COL_Q_MED }} /> medium
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-6 rounded-sm" style={{ background: COL_Q_LONG }} /> long
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Pick a pub on the left.</div>
              ))}

              {/* Summary cards */}
              {selected && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-muted-foreground">Data points</div>
                    <div className="text-lg font-semibold">{nightStats.count}</div>
                  </div>
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-muted-foreground">Distinct hours</div>
                    <div className="text-lg font-semibold">{nightStats.hoursCovered}</div>
                  </div>
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-muted-foreground">Peak total</div>
                    <div className="text-lg font-semibold">{nightStats.peakTotal} people</div>
                  </div>
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-muted-foreground">Avg occupancy</div>
                    <div className="text-lg font-semibold">{nightStats.avgOcc}%</div>
                  </div>
                  <div className="rounded-xl border p-2">
                    <div className="text-xs text-muted-foreground">Avg ratio</div>
                    <div className="text-lg font-semibold">
                      {nightStats.ratioMembersPct}% / {nightStats.ratioNonMembersPct}%
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      (Members / Non-members)
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
