"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/tailgrids/core/card";
import { Badge } from "@/components/tailgrids/core/badge";
import { Input } from "@/components/tailgrids/core/input";
import { buttonStyles } from "@/components/tailgrids/core/button";

interface WorkItem {
  id: string;
  title: string;
  category: string;
  videoUrl?: string;
  youtubeId?: string | null;
  thumbnailUrl?: string;
  publishAt?: string;
  publishedAt?: string;
  isNewRelease?: boolean;
  badge?: string;
}

function getYoutubeThumb(ytId?: string | null) {
  return ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "";
}

export default function WorksCatalogPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchWorks = () => {
    setLoading(true);
    fetch("/api/works?includeScheduled=true", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setWorks(data))
      .catch(() => toast.error("Failed to load works"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["ALL"]);
    works.forEach((w) => w.category && set.add(w.category));
    return Array.from(set);
  }, [works]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return works.filter((w) => {
      const catOk = categoryFilter === "ALL" || w.category === categoryFilter;
      const qOk =
        !q ||
        w.title.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [works, search, categoryFilter]);

  async function handleDelete(id: string, title: string) {
    try {
      const res = await fetch(`/api/works?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Failed to remove work.");
        return;
      }
      setWorks((prev) => prev.filter((w) => w.id !== id));
      toast.success(`Deleted "${title}"`);
    } catch {
      toast.error("Delete request failed.");
    }
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[28px] leading-8 font-semibold text-text-primary">
            Works & Portfolio ({works.length})
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Manage YouTube muted-autoplay films, uploaded videos, thumbnails, and release schedules.
          </p>
        </div>

        <Link
          href="/works/add"
          className={buttonStyles({ variant: "primary", appearance: "fill", size: "sm", className: "px-4 py-2" })}
        >
          + Add Work
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                categoryFilter === cat
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-card-border bg-card-background text-text-secondary hover:text-text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search works..."
            className="w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-text-tertiary">Loading portfolio...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-text-tertiary">No works match this filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((work) => {
            const sched = work.publishAt || work.publishedAt;
            const isScheduled = sched && new Date(sched).getTime() > Date.now();
            const ytId = work.youtubeId;
            const thumb = work.thumbnailUrl || getYoutubeThumb(ytId);

            return (
              <Card key={work.id} className="overflow-hidden p-0">
                <div className="relative aspect-video bg-black">
                  {ytId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1`}
                      allow="autoplay; encrypted-media"
                      loading="lazy"
                      className="h-full w-full border-0"
                      title={work.title}
                    />
                  ) : work.videoUrl && !thumb ? (
                    <video
                      src={work.videoUrl.startsWith("public/") ? `/${work.videoUrl}` : work.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : thumb ? (
                    <img src={thumb} alt={work.title} className="h-full w-full object-cover" />
                  ) : null}

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge color={ytId ? "error" : "blue"} size="sm">
                      {ytId ? "YouTube Autoplay" : "Uploaded MP4"}
                    </Badge>
                    <Badge color={isScheduled ? "warning" : "success"} size="sm">
                      {isScheduled ? "Scheduled" : "Published"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-text-tertiary uppercase">{work.category}</p>
                  <h3 className="mt-1 truncate text-base font-semibold text-text-primary">
                    {work.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between border-t border-card-border pt-3">
                    <span className="text-xs text-text-tertiary">
                      {sched ? new Date(sched).toLocaleDateString() : "Immediate"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(work.id, work.title)}
                      className="text-xs font-medium text-error-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
