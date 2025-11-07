"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface ProfileSettingsProps {
  profile: Profile | null;
  user: User;
}

export function ProfileSettings({ profile, user }: ProfileSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormData({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
    });
    setAvatarUrl(profile.avatar_url || "");
  }, [profile]);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload an image (JPEG, PNG, WEBP, GIF).");
      resetFileInput();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 5MB.");
      resetFileInput();
      return;
    }

    setError(null);
    setSuccess(false);
    setIsUploading(true);

    try {
      const supabase = createClient();

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const uniqueName =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const filePath = `${user.id}/${uniqueName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload avatar");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(updateError.message || "Failed to update avatar URL");
      }

      setAvatarUrl(publicUrl);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      resetFileInput();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();

      const trimmedFullName = formData.full_name.trim();
      const trimmedPhone = formData.phone.trim();

      if (!trimmedFullName) {
        throw new Error("Full name is required");
      }

      const payload = {
        full_name: trimmedFullName,
        phone: trimmedPhone ? trimmedPhone : null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      };

      const query = profile
        ? supabase.from("profiles").update(payload).eq("id", user.id)
        : supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email ?? "",
              role: "accountant",
              created_at: new Date().toISOString(),
              ...payload,
            },
            { onConflict: "id" }
          );

      const { data, error: updateError } = await query.select().maybeSingle();

      if (updateError) {
        throw new Error(updateError.message || "Failed to update profile");
      }

      setFormData({
        full_name: data?.full_name ?? trimmedFullName,
        phone: data?.phone ?? trimmedPhone,
      });
      setAvatarUrl(data?.avatar_url ?? avatarUrl ?? "");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const initials =
    formData.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user.email?.[0].toUpperCase() ||
    "U";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and profile details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={avatarUrl || "/placeholder.svg"}
                alt={formData.full_name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Change Photo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Upload a JPG, PNG, WEBP or GIF up to 5MB
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+373 69 123 456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={profile?.role || "Accountant"}
              disabled
              className="bg-muted capitalize"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-success">
                Profile updated successfully!
              </p>
            </div>
          )}

          <Button type="submit" disabled={isLoading || isUploading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
