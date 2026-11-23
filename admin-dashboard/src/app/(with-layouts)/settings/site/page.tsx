"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";

interface CppPartner {
  platform: "instagram" | "facebook" | "youtube" | "x" | "website" | string;
  handle: string;
  url: string;
}

interface SiteSettingsData {
  studioName: string;
  heroTitle: string;
  contactEmail: string;
  xUrl: string;
  instagramUrl: string;
  threadsUrl: string;
}

export default function SiteSettingsPage() {
  const [site, setSite] = useState<SiteSettingsData>({
    studioName: "MadeArt",
    heroTitle: "Visual Atelier & AI Production",
    contactEmail: "hello@madeartagency.com",
    xUrl: "",
    instagramUrl: "",
    threadsUrl: "",
  });
  const [cpp, setCpp] = useState<CppPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.site) setSite((prev) => ({ ...prev, ...data.site }));
        if (Array.isArray(data.cpp)) setCpp(data.cpp);
      })
      .catch(() => toast.error("Failed to fetch studio site settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleAddPartner = () => {
    setCpp((prev) => [
      ...prev,
      { platform: "instagram", handle: "@newpartner", url: "https://instagram.com/" },
    ]);
  };

  const handleRemovePartner = (index: number) => {
    setCpp((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ site, cpp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings.");
      toast.success("Site configuration & Creative Partner Programs updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update site settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Site & Creative Partner Programs (CPP)
        </h1>
        <p className="text-sm text-text-tertiary">
          Manage studio contact endpoints and Creative Partner social badges displayed at
          the bottom of your public forms and footer.
        </p>
      </div>

      {loading ? (
        <Card className="h-64 animate-pulse p-6" />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 border-b border-card-border pb-3 text-base font-semibold text-text-primary">
              Studio Metadata & Social Handles
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Studio Brand Name
                </label>
                <Input
                  value={site.studioName}
                  onChange={(e) => setSite((s) => ({ ...s, studioName: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={site.contactEmail}
                  onChange={(e) =>
                    setSite((s) => ({ ...s, contactEmail: e.target.value }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Hero Headline
                </label>
                <Input
                  value={site.heroTitle}
                  onChange={(e) => setSite((s) => ({ ...s, heroTitle: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Instagram Profile URL
                </label>
                <Input
                  value={site.instagramUrl || ""}
                  onChange={(e) =>
                    setSite((s) => ({ ...s, instagramUrl: e.target.value }))
                  }
                  placeholder="https://instagram.com/madeartagency"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  X (Twitter) Profile URL
                </label>
                <Input
                  value={site.xUrl || ""}
                  onChange={(e) => setSite((s) => ({ ...s, xUrl: e.target.value }))}
                  placeholder="https://x.com/madeartagency"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-card-border pb-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Creative Partner Programs (CPP)
                </h2>
                <p className="text-xs text-text-tertiary">
                  Supports Instagram profiles, Facebook pages, or YouTube channels.
                </p>
              </div>
              <Button
                type="button"
                appearance="outline"
                size="sm"
                onPress={handleAddPartner}
                className="border px-3 py-1.5"
              >
                + Add Partner
              </Button>
            </div>

            {cpp.length === 0 ? (
              <p className="py-6 text-center text-xs text-text-tertiary">
                No Creative Partners added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {cpp.map((partner, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 items-end gap-3 rounded-xl border border-card-border p-3 md:grid-cols-12"
                  >
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-text-tertiary">
                        Platform
                      </label>
                      <select
                        value={partner.platform}
                        onChange={(e) =>
                          setCpp((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, platform: e.target.value } : item
                            )
                          )
                        }
                        className="h-10 w-full rounded-lg border border-input-border bg-input-background px-3 text-sm text-text-primary"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="youtube">YouTube</option>
                        <option value="x">X / Twitter</option>
                        <option value="website">Website</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-text-tertiary">
                        Display Handle / Name
                      </label>
                      <Input
                        value={partner.handle}
                        onChange={(e) =>
                          setCpp((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, handle: e.target.value } : item
                            )
                          )
                        }
                      />
                    </div>

                    <div className="md:col-span-5">
                      <label className="mb-1 block text-xs font-medium text-text-tertiary">
                        Profile / Channel URL
                      </label>
                      <Input
                        value={partner.url}
                        onChange={(e) =>
                          setCpp((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, url: e.target.value } : item
                            )
                          )
                        }
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemovePartner(idx)}
                        className="h-10 rounded-lg border border-error-200 px-3 text-xs font-medium text-error-600 hover:bg-error-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" isDisabled={saving}>
              {saving ? "Saving Settings..." : "Save Site Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
