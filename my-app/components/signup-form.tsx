"use client";
import React from 'react';
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    facebook: ""
  });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: "", email: "", organization: "", facebook: "" });
        setOpen(false);
      } else {
        alert("Något gick fel. Försök igen.");
      }
    } catch {
      alert("Ett fel uppstod. Försök igen senare.");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
  <Button className="!h-auto !min-w-[auto] rounded-lg bg-green-600 px-6 py-3 font-medium text-white shadow-md transition hover:bg-green-700">
    Skapa konto
  </Button>


</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skapa konto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Namn och roll</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="organization">Klubbmästeri / Förening</Label>
            <Input id="organization" name="organization" value={formData.organization} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="facebook">Facebook länk (valfritt)</Label>
            <Input id="facebook" name="facebook" value={formData.facebook} onChange={handleChange} />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? "Skickar..." : "Skicka ansökan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
