"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Image as ImageIcon, Settings2 } from "lucide-react";

type Patch = {
  id: number;
  organization_id: number;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  auto_link_to_events: boolean;
  temporarily_sold_out: boolean;
  discontinued: boolean;
  created_at?: string;
  updated_at?: string;
  organization_name?: string;
  organization_logo_url?: string;
};

type Profile = { id: number; role: string; organization_id: number | undefined };

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const getPatchImageSrc = (imageUrl?: string) => {
  if (!imageUrl) return;
  if (imageUrl.startsWith("data:")) return imageUrl;
  if (!API_BASE) return imageUrl;
  return `${API_BASE}/api/patches/image-proxy?url=${encodeURIComponent(imageUrl)}`;
};

const readErrorMessage = async (res: Response) => {
  const txt = await res.text();
  try {
    const j = JSON.parse(txt);
    return j?.error || j?.message || txt || `${res.status} ${res.statusText}`;
  } catch {
    return txt || `${res.status} ${res.statusText}`;
  }
};

const fetchJSON = async (url: string, init?: Parameters<typeof fetch>[1]) => {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.json();
};

export default function PatchesPage() {
  const [profile, setProfile] = useState<Profile | undefined>();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [loadingPatches, setLoadingPatches] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [patchDialogOpen, setPatchDialogOpen] = useState(false);
  const [editingPatch, setEditingPatch] = useState<Patch | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patchToDelete, setPatchToDelete] = useState<Patch | undefined>();
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" | "info" } | undefined>();

  let bannerToneClass = "bg-neutral-700";
  if (banner?.type === "success") bannerToneClass = "bg-green-600";
  else if (banner?.type === "error") bannerToneClass = "bg-red-600";

  const show = (text: string, type: "success" | "error" | "info" = "info") => {
    setBanner({ text, type });
    setTimeout(() => setBanner(undefined), 3000);
  };

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

  const loadPatches = async () => {
    setLoadingPatches(true);
    try {
      const data = await fetchJSON(`${API_BASE}/api/patches/org`);
      setPatches(data);
    } catch {
      show("Failed to load patches", "error");
    } finally {
      setLoadingPatches(false);
    }
  };

  useEffect(() => {
    if (!loadingProfile && (profile?.role === "ORG_ADMIN" || profile?.role === "SUPER_ADMIN")) {
      loadPatches();
    }
  }, [loadingProfile, profile?.role]);

  const filteredPatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patches;
    return patches.filter((p) =>
      [p.name, p.description, String(p.price)]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [patches, searchQuery]);

  const handleDeletePatch = async (patch: Patch) => {
    try {
      await fetchJSON(`${API_BASE}/api/patches/delete/${patch.id}`, {
        method: "DELETE",
      });
      show("Patch deleted successfully", "success");
      loadPatches();
    } catch (error) {
      show(error instanceof Error ? error.message : "Failed to delete patch", "error");
    } finally {
      setDeleteDialogOpen(false);
      setPatchToDelete(undefined);
    }
  };

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
            className={`fixed inset-x-4 top-4 z-50 rounded-lg px-4 py-2 text-white shadow-lg sm:inset-x-auto sm:right-4 ${bannerToneClass}`}
          >
            {banner.text}
          </div>
        )}

        <header className="flex h-14 items-center gap-2 border-b bg-background/60 backdrop-blur-sm sm:h-16">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />
            <h1 className="text-base font-semibold sm:text-xl">Patches</h1>
          </div>
        </header>

        <div className="w-full px-4 py-6 sm:px-6 md:p-10">
          <main className="mx-auto w-full max-w-7xl">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Manage Patches</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search patches…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setEditingPatch(undefined);
                      setPatchDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 size-4" />
                    Add Patch
                  </Button>
                </div>

                {loadingPatches && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                  </div>
                )}

                {!loadingPatches && filteredPatches.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    {searchQuery ? "No patches found matching your search." : "No patches yet. Create your first patch!"}
                  </div>
                )}

                {!loadingPatches && filteredPatches.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPatches.map((patch) => (
                      <Card key={patch.id} className="overflow-hidden">
                        <div className="relative aspect-square w-full overflow-hidden bg-muted">
                          {patch.image_url ? (
                            <img
                              src={getPatchImageSrc(patch.image_url)}
                              alt={patch.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <ImageIcon className="size-16 text-muted-foreground/50" />
                            </div>
                          )}
                          {patch.discontinued && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                              <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                                Discontinued
                              </span>
                            </div>
                          )}
                          {!patch.discontinued && patch.temporarily_sold_out && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                              <span className="rounded-full bg-orange-600 px-3 py-1 text-sm font-semibold text-white">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="mb-1 text-lg font-semibold">{patch.name}</h3>
                          {patch.description && (
                            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                              {patch.description}
                            </p>
                          )}
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-semibold text-primary">
                              {patch.price ? `${patch.price} kr` : "Price not set"}
                            </span>
                            {patch.auto_link_to_events && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Auto-linked
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setEditingPatch(patch);
                                setPatchDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 size-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setPatchToDelete(patch);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>

        <PatchDialog
          open={patchDialogOpen}
          onOpenChange={setPatchDialogOpen}
          patch={editingPatch}
          onSuccess={() => {
            loadPatches();
            setPatchDialogOpen(false);
            setEditingPatch(undefined);
          }}
          onError={(msg) => show(msg, "error")}
          onSuccess2={(msg) => show(msg, "success")}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Patch</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{patchToDelete?.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => patchToDelete && handleDeletePatch(patchToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PatchDialog({
  open,
  onOpenChange,
  patch,
  onSuccess,
  onError,
  onSuccess2,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patch?: Patch;
  onSuccess: () => void;
  onError: (msg: string) => void;
  onSuccess2: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [autoLink, setAutoLink] = useState(false);
  const [soldOut, setSoldOut] = useState(false);
  const [discontinued, setDiscontinued] = useState(false);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  let submitLabel = "Create Patch";
  if (patch) submitLabel = "Save Changes";
  if (saving) submitLabel = "Saving...";

  useEffect(() => {
    if (patch) {
      setName(patch.name);
      setDescription(patch.description || "");
      setPrice(patch.price ? String(patch.price) : "");
      setAutoLink(patch.auto_link_to_events);
      setSoldOut(patch.temporarily_sold_out);
      setDiscontinued(patch.discontinued);
      setPreviewUrl(patch.image_url || undefined);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setAutoLink(false);
      setSoldOut(false);
      setDiscontinued(false);
      setPreviewUrl(undefined);
    }
    setImageFile(undefined);
  }, [patch, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      onError("Patch name is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price || "");
      formData.append("auto_link_to_events", String(autoLink));
      formData.append("temporarily_sold_out", String(soldOut));
      formData.append("discontinued", String(discontinued));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const url = patch
        ? `${API_BASE}/api/patches/update/${patch.id}`
        : `${API_BASE}/api/patches/create`;
      const method = patch ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error(await readErrorMessage(res));

      onSuccess2(patch ? "Patch updated successfully" : "Patch created successfully");
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to save patch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{patch ? "Edit Patch" : "Create Patch"}</DialogTitle>
          <DialogDescription>
            {patch ? "Update patch details and settings." : "Add a new patch to your organization."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="patch-name">Name *</Label>
            <Input
              id="patch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patch name"
            />
          </div>

          <div>
            <Label htmlFor="patch-description">Description</Label>
            <Textarea
              id="patch-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Patch description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="patch-price">Price (kr)</Label>
            <Input
              id="patch-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="patch-image">Image</Label>
            <Input
              id="patch-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {previewUrl && (
              <div className="mt-2">
                <img
                  src={getPatchImageSrc(previewUrl)}
                  alt="Preview"
                  className="size-32 rounded-lg object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Settings2 className="size-4 text-muted-foreground" />
              Patch Settings
            </div>

            <label
              htmlFor="auto-link"
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 transition hover:border-primary/50"
            >
              <Checkbox
                id="auto-link"
                checked={autoLink}
                onCheckedChange={(checked: boolean) => setAutoLink(checked === true)}
              />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Automatically link to upcoming events</div>
                <p className="text-xs text-muted-foreground">
                  Adds this patch to all upcoming events that sell patches.
                </p>
              </div>
            </label>

            <label
              htmlFor="sold-out"
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 transition hover:border-primary/50"
            >
              <Checkbox
                id="sold-out"
                checked={soldOut}
                onCheckedChange={(checked: boolean) => setSoldOut(checked === true)}
              />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Temporarily sold out</div>
                <p className="text-xs text-muted-foreground">
                  Shows a sold out badge while keeping the patch visible.
                </p>
              </div>
            </label>

            <label
              htmlFor="discontinued"
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 transition hover:border-primary/50"
            >
              <Checkbox
                id="discontinued"
                checked={discontinued}
                onCheckedChange={(checked: boolean) => setDiscontinued(checked === true)}
              />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Discontinued</div>
                <p className="text-xs text-muted-foreground">
                  Mark as discontinued and display it publicly as informational.
                </p>
              </div>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
