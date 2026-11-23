"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { Card } from "@/components/tailgrids/core/card";

export default function MadeArtLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated) {
          router.replace("/");
        }
      })
      .catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Please enter the administrator password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setError(data.error || "Invalid password.");
        toast.error("Invalid administrator password.");
        setLoading(false);
        return;
      }
      toast.success("Welcome back to MadeArt Studio");
      router.replace("/");
    } catch {
      setError("Unable to reach MadeArt API server.");
      toast.error("Authentication request failed.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-soft-100 p-4 dark:bg-background-50">
      <Card className="w-full max-w-md border-card-border bg-card-background p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold tracking-tight text-white">
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            MadeArt Admin
          </h1>
          <p className="mt-1.5 text-sm text-text-tertiary">
            AI Production Studio Control Center
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Administrator Password
            </label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to unlock..."
              autoFocus
              className="w-full"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-error-500/30 bg-error-500/10 px-3 py-2 text-xs text-error-500">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            appearance="fill"
            isDisabled={loading}
            className="w-full justify-center py-2.5"
          >
            {loading ? "Signing in..." : "Unlock MadeArt Studio"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-text-tertiary">
          Single-admin session · MadeArt AI Production
        </p>
      </Card>
    </div>
  );
}
