"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";

interface SecretsState {
  gemini: {
    enabled: boolean;
    apiKey: string;
    hasKey: boolean;
    clear?: boolean;
  };
}

export default function IntegrationsSettingsPage() {
  const [secrets, setSecrets] = useState<SecretsState>({
    gemini: { enabled: false, apiKey: "", hasKey: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/secrets", { credentials: "include", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!controller.signal.aborted && data?.gemini) {
          setSecrets({ gemini: data.gemini });
        }
      })
      .catch((err) => {
        if ((err as Error)?.name !== "AbortError") {
          toast.error("Failed to fetch Gemini AI settings.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(secrets),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");
      if (data.secrets?.gemini) setSecrets({ gemini: data.secrets.gemini });
      toast.success("Gemini API credentials saved securely.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Gemini AI Settings</h1>
        <p className="text-sm text-text-tertiary">
          Configure your Google Gemini API key used for generating trilingual EN / AR / FR
          project descriptions when adding works.
        </p>
      </div>

      {loading ? (
        <Card className="h-56 animate-pulse p-6" />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-card-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Google Gemini API
                </h2>
                <p className="text-xs text-text-tertiary">
                  Stored locally on the server and masked (`••••`) when viewed.
                </p>
              </div>
              <Badge color={secrets.gemini.hasKey ? "success" : "gray"} size="sm">
                {secrets.gemini.hasKey ? "Key Stored" : "Not Configured"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-primary">
                  Gemini API Key
                </label>
                <Input
                  type="password"
                  value={secrets.gemini.apiKey}
                  onChange={(e) =>
                    setSecrets((prev) => ({
                      ...prev,
                      gemini: { ...prev.gemini, apiKey: e.target.value, clear: false },
                    }))
                  }
                  placeholder="AIza..."
                />
                <p className="mt-1 text-[11px] text-text-tertiary">
                  Masked keys (`••••`) stay untouched unless overwritten or cleared.
                </p>
              </div>

              <div className="flex flex-col justify-between gap-3 pt-5">
                <label className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={secrets.gemini.enabled}
                    onChange={(e) =>
                      setSecrets((prev) => ({
                        ...prev,
                        gemini: { ...prev.gemini, enabled: e.target.checked },
                      }))
                    }
                    className="size-4 rounded border-input-border text-primary-500"
                  />
                  Enable Gemini AI trilingual copy generation
                </label>

                {secrets.gemini.hasKey && (
                  <button
                    type="button"
                    onClick={() =>
                      setSecrets((prev) => ({
                        ...prev,
                        gemini: {
                          ...prev.gemini,
                          apiKey: "",
                          hasKey: false,
                          clear: true,
                        },
                      }))
                    }
                    className="self-start text-xs font-medium text-error-600 hover:underline"
                  >
                    Clear stored Gemini key
                  </button>
                )}
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" isDisabled={saving}>
              {saving ? "Saving Key..." : "Save Gemini Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
