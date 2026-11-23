"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authenticated" | "redirecting">("checking");

  useEffect(() => {
    let active = true;
    fetch("/api/auth", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.authenticated) {
          setStatus("authenticated");
        } else {
          setStatus("redirecting");
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus("redirecting");
        router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="text-sm text-text-tertiary">
          {status === "checking" ? "Verifying MadeArt Admin session..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
