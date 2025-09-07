"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RequestInit } from "next/dist/server/web/spec-extension/request";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "USER";

type UserRow = {
  id: number;
  username: string;
  role: Role;
  organization_id: number | undefined ;
  email: string | undefined ;
};

type VenueRow = {
  id: number;
  name: string;
  location: string | undefined ;
  address: string | undefined ;
  maps_link: string | undefined ;
};

type OrgRow = {
  id: number;
  name: string;
  display_name: string | undefined ;
  venue_id: number | undefined ;
  logo_url: string | undefined ;
  fb_page: string | undefined ;
  description: string | undefined ;
};

type Profile = { id: number; role: Role; organization_id: number | undefined  };

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const readErrorMessage = async (res: Response) => {
  const txt = await res.text();
  try {
    const j = JSON.parse(txt);
    return j?.error || j?.message || txt || `${res.status} ${res.statusText}`;
  } catch {
    return txt || `${res.status} ${res.statusText}`;
  }
};

const fetchJSON = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.json();
};



// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [orgError,   setOrgError] = useState<string | undefined >();
  const [userError,  setUserError] = useState<string | undefined >();
  const [venueError, setVenueError] = useState<string | undefined >();
  const [profile, setProfile] = useState<Profile | undefined >();
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [venues, setVenues] = useState<VenueRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | undefined >( );

  const [searchOrgs, setSearchOrgs] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [searchVenues, setSearchVenues] = useState("");

  // Dialog state (org)
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrgRow | undefined >();

  // Dialog state (user)
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | undefined >();

  // Dialog state (venue)
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueRow | undefined >();

  // ── helpers ────────────────────────────────────────────────────────────────
  const show = (text: string, type: "success" | "error" | "info" = "info") => {
    setBanner({ text, type });
    setTimeout(() => setBanner(undefined ), 3000);
  };

  // ── load profile & gate by role ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const p = await fetchJSON(`${API_BASE}/api/users/profile`);
        setProfile(p);
      } catch {
        show("Failed to load profile", "error");
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  // ── load data ──────────────────────────────────────────────────────────────
  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [o, u, v] = await Promise.all([
        fetchJSON(`${API_BASE}/api/organizations`),
        fetchJSON(`${API_BASE}/api/users/getAll`),
        fetchJSON(`${API_BASE}/api/venues`),
      ]);
      setOrgs(o);
      setUsers(u);
      setVenues(v);
    } catch {
      show("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingProfile && profile?.role === "SUPER_ADMIN") {
      loadAll();
    }
  }, [loadingProfile, profile?.role, loadAll]);

  // ── filters ────────────────────────────────────────────────────────────────
  const filteredOrgs = useMemo(() => {
    const q = searchOrgs.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((r) =>
      [r.name, r.display_name, String(r.id)].some((x) => (x || "").toLowerCase().includes(q))
    );
  }, [orgs, searchOrgs]);

  const filteredUsers = useMemo(() => {
    const q = searchUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter((r) =>
      [r.username, r.email, r.role, String(r.organization_id), String(r.id)]
        .filter(Boolean)
        .some((x) => (String(x)).toLowerCase().includes(q))
    );
  }, [users, searchUsers]);

  const filteredVenues = useMemo(() => {
    const q = searchVenues.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((r) =>
      [r.name, r.location, r.address, String(r.id)]
        .filter(Boolean)
        .some((x) => (String(x)).toLowerCase().includes(q))
    );
  }, [venues, searchVenues]);

  // ───────────────────────────────────────────────────────────────────────────
  // CRUD actions (Orgs)
  // ───────────────────────────────────────────────────────────────────────────
  // ORGS
const upsertOrg = async (payload: Partial<OrgRow> & { id?: number }) => {
  setOrgError(undefined );
  try {
    if (payload.id) {
      await fetchJSON(`${API_BASE}/api/organizations/update${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      show("Organization updated", "success");
    } else {
      await fetchJSON(`${API_BASE}/api/organizations/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      show("Organization created", "success");
    }
    setOrgDialogOpen(false);
    setEditingOrg(undefined );
    loadAll();
  } catch (error) {
    setOrgError(error instanceof Error ? error.message : "Failed to save organization");
  } 
};

// USERS
const upsertUser = async (payload: Partial<UserRow> & { id?: number; password?: string }) => {
  setUserError(undefined );
  try {
    if (payload.id) {
      await fetchJSON(`${API_BASE}/api/users/update${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      show("User updated", "success");
    } else {
      await fetchJSON(`${API_BASE}/api/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      show("User created", "success");
    }
    setUserDialogOpen(false);
    setEditingUser(undefined );
    loadAll();
  } catch (error) {
    setUserError(error instanceof Error ? error.message : "Failed to save user");
  }
};

// VENUES
const upsertVenue = async (payload: Partial<VenueRow> & { id?: number }) => {
  setVenueError(undefined );
  try {
    if (payload.id) {
      await fetchJSON(`${API_BASE}/api/venues/update${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      show("Venue updated", "success");
    } else {
      await fetchJSON(`${API_BASE}/api/venues/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      show("Venue created", "success");
    }
    setVenueDialogOpen(false);
    setEditingVenue(undefined );
    loadAll();
  } catch (error) {
    setVenueError(error instanceof Error ? error.message : "Failed to save venue");
  }
};


  // ───────────────────────────────────────────────────────────────────────────
  // Forms
  // ───────────────────────────────────────────────────────────────────────────

  const OrgForm: React.FC<{ initial?: OrgRow | undefined ; onSubmit: (data: Partial<OrgRow>) => void }> = ({
    initial,
    onSubmit,
  }) => {
    const [name, setName] = useState(initial?.name ?? "");
    const [display_name, setDisplayName] = useState(initial?.display_name ?? "");
    const [venue_id, setVenueId] = useState<string>(
  initial?.venue_id ? String(initial.venue_id) : "none"
);
    const [logo_url, setLogoUrl] = useState(initial?.logo_url ?? "");
    const [fb_page, setFbPage] = useState(initial?.fb_page ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="org_name">Name</Label>
            <Input id="org_name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="org_display_name">Display name</Label>
            <Input
              id="org_display_name"
              value={display_name}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Default venue</Label>
            <Select value={venue_id} onValueChange={setVenueId}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select a venue" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">(Unassigned)</SelectItem>
    {venues.map((v) => (
      <SelectItem key={v.id} value={String(v.id)}>
        {v.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
          </div>
          <div>
            <Label htmlFor="org_logo">Logo URL</Label>
            <Input id="org_logo" value={logo_url} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="org_fb">Facebook page</Label>
            <Input id="org_fb" value={fb_page} onChange={(e) => setFbPage(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="org_desc">Description</Label>
            <Textarea
              id="org_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              onSubmit({
  id: initial?.id,
  name,
  display_name,
  venue_id: venue_id === "none" ? undefined  : Number(venue_id),
  logo_url: logo_url || undefined ,
  fb_page: fb_page || undefined ,
  description: description || undefined ,
})}
          >
            {initial?.id ? "Save changes" : "Create organization"}
          </Button>
        </DialogFooter>
      </div>
    );
  };

  const UserForm: React.FC<{
    initial?: UserRow | undefined ;
    onSubmit: (data: Partial<UserRow> & { password?: string }) => void;
  }> = ({ initial, onSubmit }) => {
    const [username, setUsername] = useState(initial?.username ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [role, setRole] = useState<Role>(initial?.role ?? "USER");
    const [organization_id, setOrgId] = useState<string>(
    initial?.organization_id ? String(initial.organization_id) : "none"
  );
    const [password, setPassword] = useState("");

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="user_username">Username</Label>
            <Input
              id="user_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="user_email">Email</Label>
            <Input id="user_email" value={email || ""} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {(["USER", "ORG_ADMIN", "SUPER_ADMIN"] as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Organization</Label>
            <Select value={organization_id} onValueChange={setOrgId}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="(Optional) Assign to organization" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">(Unassigned)</SelectItem>
    {orgs.map((o) => (
      <SelectItem key={o.id} value={String(o.id)}>
        {o.display_name || o.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

          </div>
        </div>
        <div>
          <Label htmlFor="user_password">{initial?.id ? "Set new password (optional)" : "Password"}</Label>
          <Input
            id="user_password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={initial?.id ? "Leave blank to keep current password" : ""}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              onSubmit({
  id: initial?.id,
  username,
  email: email || undefined ,
  role,
  organization_id: organization_id === "none" ? undefined  : Number(organization_id),
  ...(password ? { password } : {}),
})}
          >
            {initial?.id ? "Save changes" : "Create user"}
          </Button>
        </DialogFooter>
      </div>
    );
  };

  const VenueForm: React.FC<{ initial?: VenueRow | undefined ; onSubmit: (data: Partial<VenueRow>) => void }> = ({
    initial,
    onSubmit,
  }) => {
    const [name, setName] = useState(initial?.name ?? "");
    const [location, setLocation] = useState(initial?.location ?? "");
    const [address, setAddress] = useState(initial?.address ?? "");
    const [maps_link, setMapsLink] = useState(initial?.maps_link ?? "");

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="venue_name">Name</Label>
            <Input id="venue_name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="venue_location">Location</Label>
            <Input id="venue_location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <p className="mt-1 text-xs text-amber-700">
    Be careful: the <span className="font-mono">location</span> must match exactly. Any misspelling
    will hide the venue on <span className="font-medium">pubquery.se</span>.
  </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="venue_address">Address</Label>
            <Input id="venue_address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="venue_maps">Google Maps link</Label>
            <Input id="venue_maps" value={maps_link} onChange={(e) => setMapsLink(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSubmit({ id: initial?.id, name, location, address, maps_link })}>
            {initial?.id ? "Save changes" : "Create venue"}
          </Button>
        </DialogFooter>
      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (profile?.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {banner && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed inset-x-4 top-4 z-50 rounded-lg px-4 py-2 text-white shadow-lg sm:inset-x-auto sm:right-4 ${
              banner.type === "success" ? "bg-green-600" : (banner.type === "error" ? "bg-red-600" : "bg-neutral-700")
            }`}
          >
            {banner.text}
          </div>
        )}

        <header className="flex h-14 items-center gap-2 border-b bg-background/60 backdrop-blur-sm sm:h-16">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />
            <h1 className="text-base font-semibold sm:text-xl">Super admin</h1>
          </div>
        </header>

        <div className="w-full px-4 py-6 sm:px-6 md:p-10">
          <main className="mx-auto w-full max-w-7xl">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl">Control panel</CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                <Tabs defaultValue="organizations" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="organizations">Organizations</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="venues">Venues</TabsTrigger>
                  </TabsList>

                  {/* Orgs Tab */}
                  <TabsContent value="organizations" className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Input
                        placeholder="Search organizations…"
                        value={searchOrgs}
                        onChange={(e) => setSearchOrgs(e.target.value)}
                        className="w-full sm:max-w-xs"
                      />
                      <Button onClick={() => { setEditingOrg(undefined ); setOrgDialogOpen(true); }}>
                        Add organization
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Display name</TableHead>
                            <TableHead>Default venue</TableHead>
                            <TableHead className="hidden md:table-cell">Facebook</TableHead>
                            <TableHead className="hidden md:table-cell">Logo</TableHead>
                            <TableHead className="w-40 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={7}>
                                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                              </TableCell>
                            </TableRow>
                          ) : (filteredOrgs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7}>
                                <div className="p-4 text-sm text-muted-foreground">No organizations</div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredOrgs.map((o) => {
                              const venueName = venues.find((v) => v.id === o.venue_id)?.name || "—";
                              return (
                                <TableRow key={o.id}>
                                  <TableCell>{o.id}</TableCell>
                                  <TableCell>{o.name}</TableCell>
                                  <TableCell>{o.display_name || "—"}</TableCell>
                                  <TableCell>{venueName}</TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {o.fb_page ? (
                                      <Link className="underline underline-offset-2" href={`https://facebook.com/${o.fb_page}`} target="_blank">
                                        {o.fb_page}
                                      </Link>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {o.logo_url ? (
                                      <Link className="underline underline-offset-2" href={o.logo_url} target="_blank">
                                        logo
                                      </Link>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="secondary" size="sm" onClick={() => { setEditingOrg(o); setOrgDialogOpen(true); }}>
                                        Edit
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Users Tab */}
                  <TabsContent value="users" className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Input
                        placeholder="Search users…"
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                        className="w-full sm:max-w-xs"
                      />
                      <Button onClick={() => { setEditingUser(undefined ); setUserDialogOpen(true); }}>
                        Add user
                      </Button>
                    </div>  
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead className="w-40 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                              </TableCell>
                            </TableRow>
                          ) : (filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <div className="p-4 text-sm text-muted-foreground">No users</div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((u) => {
                              const orgName = orgs.find((o) => o.id === u.organization_id)?.display_name || orgs.find((o) => o.id === u.organization_id)?.name || "—";
                              return (
                                <TableRow key={u.id}>
                                  <TableCell>{u.id}</TableCell>
                                  <TableCell>{u.username}</TableCell>
                                  <TableCell>{u.email || "—"}</TableCell>
                                  <TableCell>{u.role}</TableCell>
                                  <TableCell>{orgName}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button variant="secondary" size="sm" onClick={() => { setEditingUser(u); setUserDialogOpen(true); }}>
                                        Edit
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Venues Tab */}
                  <TabsContent value="venues" className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Input
                        placeholder="Search venues…"
                        value={searchVenues}
                        onChange={(e) => setSearchVenues(e.target.value)}
                        className="w-full sm:max-w-xs"
                      />
                      <Button onClick={() => { setEditingVenue(undefined ); setVenueDialogOpen(true); }}>
                        Add venue
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="hidden md:table-cell">Map</TableHead>
                            <TableHead className="w-40 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                              </TableCell>
                            </TableRow>
                          ) : (filteredVenues.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <div className="p-4 text-sm text-muted-foreground">No venues</div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredVenues.map((v) => (
                              <TableRow key={v.id}>
                                <TableCell>{v.id}</TableCell>
                                <TableCell>{v.name}</TableCell>
                                <TableCell>{v.location || "—"}</TableCell>
                                <TableCell>{v.address || "—"}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {v.maps_link ? (
                                    <Link className="underline underline-offset-2" href={v.maps_link} target="_blank">
                                      map
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => { setEditingVenue(v); setVenueDialogOpen(true); }}>
                                      Edit
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </main>
        </div>

        {/* ── Org Dialog ─────────────────────────────────────────────────── */}
       <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>{editingOrg ? "Edit organization" : "Add organization"}</DialogTitle>
      <DialogDescription>Set the public information and default venue.</DialogDescription>
      {orgError && <p className="mt-2 text-sm text-red-600">{orgError}</p>}
    </DialogHeader>
    <OrgForm initial={editingOrg} onSubmit={upsertOrg} />
  </DialogContent>
</Dialog>

{/* User Dialog */}
<Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>{editingUser ? "Edit user" : "Add user"}</DialogTitle>
      <DialogDescription>Manage credentials and role.</DialogDescription>
      {userError && <p className="mt-2 text-sm text-red-600">{userError}</p>}
    </DialogHeader>
    <UserForm initial={editingUser} onSubmit={upsertUser} />
  </DialogContent>
</Dialog>

{/* Venue Dialog */}
<Dialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen}>
  <DialogContent className="sm:max-w-2xl">
    <DialogHeader>
      <DialogTitle>{editingVenue ? "Edit venue" : "Add venue"}</DialogTitle>
      <DialogDescription>Set location and map info.</DialogDescription>
      {venueError && <p className="mt-2 text-sm text-red-600">{venueError}</p>}
    </DialogHeader>
    <VenueForm initial={editingVenue} onSubmit={upsertVenue} />
  </DialogContent>
</Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
