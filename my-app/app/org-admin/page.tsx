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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import Link from "next/link";

type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "USER";

type UserRow = {
  id: number;
  username: string;
  role: Role;
  organization_id: number | undefined;
  email: string | undefined;
};

type Profile = { id: number; role: Role; organization_id: number | undefined };

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
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
};

const validateEmail = (val: string) => {
  if (!val) return; // optional field
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(val) ? undefined : "Invalid email format";
};

export default function OrgAdminPage() {
  // gate
  const [profile, setProfile] = useState<Profile | undefined>();
  const [loadingProfile, setLoadingProfile] = useState(true);

  // users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | undefined>();
  const [searchUsers, setSearchUsers] = useState("");

  // dialogs
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | undefined>();

  // banner
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" | "info" } | undefined>();

  const show = (text: string, type: "success" | "error" | "info" = "info") => {
    setBanner({ text, type });
    setTimeout(() => setBanner(undefined), 3000);
  };

  // load profile
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

  // load org-scoped users
  const loadUsers = React.useCallback(async () => {
    setLoadingUsers(true);
    try {
      const u = await fetchJSON(`${API_BASE}/api/users/getAllbyOrganization`);
      setUsers(u);
    } catch {
      show("Failed to load users", "error");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingProfile && (profile?.role === "ORG_ADMIN" || profile?.role === "SUPER_ADMIN")) {
      loadUsers();
    }
  }, [loadingProfile, profile?.role, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchUsers.trim().toLowerCase();
    if (!q) return users;
    return users.filter((r) =>
      [r.username, r.email, r.role, String(r.id)]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [users, searchUsers]);

  // create/update user (org is locked by server)
  const upsertUser = async (payload: Partial<UserRow> & { id?: number; password?: string }) => {
    setUserError(undefined);
    
    try {
        const body = {
      ...payload,
      ...(profile?.organization_id ? { organization_id: profile.organization_id } : {}),
      };

      if (payload.id) {
        await fetchJSON(`${API_BASE}/api/users/update${payload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        show("User updated", "success");
      } else {
        await fetchJSON(`${API_BASE}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        show("User created", "success");
      }
      setUserDialogOpen(false);
      setEditingUser(undefined);
      loadUsers();
    } catch (error) {
      setUserError(error instanceof Error ? error.message : "Failed to save user");
    }
  };

  // form component (org is not selectable)
  const UserForm: React.FC<{
    initial?: UserRow | undefined;
    onSubmit: (data: Partial<UserRow> & { password?: string }) => void;
    canUseUserRole?: boolean; // toggle if you later enable USER
  }> = ({ initial, onSubmit, canUseUserRole = false }) => {
    const [username, setUsername] = useState(initial?.username ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [role, setRole] = useState<Role>(initial?.role ?? "ORG_ADMIN"); // default to ORG_ADMIN
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState<string | undefined>();

    const roleOptions: Role[] = canUseUserRole ? (["ORG_ADMIN", "USER"] as Role[]) : (["ORG_ADMIN"] as Role[]);

    return (
      <div className="space-y-4">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="user_username">Username</Label>
            <Input id="user_username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user_email">Email</Label>
            <Input
  id="user_email"
  type="email"
  value={email || ""}
  onChange={(e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailError(validateEmail(val));
  }}
/>
{emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
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
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
  <span className="font-medium">ORG_ADMIN</span>: admin + counter.{" "}
  <span className="font-medium">USER</span>: counter only.
</p>
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
        </div>

        <DialogFooter>
          <Button
  disabled={!!emailError}
  onClick={() => {
    if (validateEmail(email)) return; // guard
    onSubmit({
      id: initial?.id,
      username,
      email: email || undefined,
      role,
      ...(password ? { password } : {}),
    });
  }}
>
  {initial?.id ? "Save changes" : "Create user"}
</Button>

        </DialogFooter>
      </div>
    );
  };

  // render gates
  if (loadingProfile) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }
  if (profile?.role !== "ORG_ADMIN" && profile?.role !== "SUPER_ADMIN") {
    return <div className="p-6 text-sm text-muted-foreground">You do not have permission to access this page.</div>;
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
            <h1 className="text-base font-semibold sm:text-xl">Organization Admin</h1>
          </div>
        </header>

        <div className="w-full px-4 py-6 sm:px-6 md:p-10">
          <main className="mx-auto w-full max-w-7xl">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl">Organization users</CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                <Tabs defaultValue="users" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="users">Users</TabsTrigger>
                  </TabsList>

                  <TabsContent value="users" className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50 text-blue-900">
  <Info className="size-4" />
  <AlertTitle>Access by role</AlertTitle>
  <AlertDescription className="space-y-1">
    <p>
      <span className="font-medium">ORG_ADMIN</span> can access both the admin panel and the counter app:
      {" "}
      <Link href="https://admin.pubquery.se" target="_blank" rel="noreferrer" className="underline">
        admin.pubquery.se
      </Link>
      {"  "}and{"  "}
      <Link href="https://counter.pubquery.se" target="_blank" rel="noreferrer" className="underline">
        counter.pubquery.se
      </Link>.
    </p>
    <p>
      <span className="font-medium">USER</span> can only access the counter app{" "}
      <Link href="https://counter.pubquery.se" target="_blank" rel="noreferrer" className="underline">
        counter.pubquery.se
      </Link>.
    </p>
  </AlertDescription>
</Alert>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Input
                        placeholder="Search users…"
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                        className="w-full sm:max-w-xs"
                      />
                      <Button
                        onClick={() => {
                          setEditingUser(undefined);
                          setUserDialogOpen(true);
                        }}
                      >
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
                            <TableHead className="w-40 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingUsers ? (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                              </TableCell>
                            </TableRow>
                          ) : (filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <div className="p-4 text-sm text-muted-foreground">No users</div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((u) => (
                              <TableRow key={u.id}>
                                <TableCell>{u.id}</TableCell>
                                <TableCell>{u.username}</TableCell>
                                <TableCell>{u.email || "—"}</TableCell>
                                <TableCell>{u.role}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {(
                                    ((profile?.role === "ORG_ADMIN" || profile?.role === "SUPER_ADMIN") && u.role === "USER") // org admin can only edit USERs
                                    ) ? (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                        setEditingUser(u);
                                        setUserDialogOpen(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    ) : undefined}
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

        {/* User Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit user" : "Add user"}</DialogTitle>
              <DialogDescription>Manage credentials and role.</DialogDescription>
              {userError && <p className="mt-2 text-sm text-red-600">{userError}</p>}
            </DialogHeader>
            <UserForm initial={editingUser} onSubmit={upsertUser} canUseUserRole={true}  />
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
