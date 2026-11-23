"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { TextArea } from "@/components/tailgrids/core/text-area";
import { Badge } from "@/components/tailgrids/core/badge";

const CATEGORIES = [
  "COMMERCIAL / AI FILM",
  "BRAND CAMPAIGN",
  "FASHION & LUXURY",
  "AUTOMOTIVE",
  "TECH & INNOVATION",
];

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
}

export default function WorkForm() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"youtube" | "upload">("youtube");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [badge, setBadge] = useState("");
  const [isNewRelease, setIsNewRelease] = useState(true);
  const [fileName, setFileName] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descFr, setDescFr] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const ytId = useMemo(
    () => (sourceType === "youtube" ? extractYouTubeId(videoUrl) : null),
    [sourceType, videoUrl]
  );

  const effectiveThumb = useMemo(() => {
    if (thumbnailUrl.trim()) return thumbnailUrl.trim();
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    return "";
  }, [thumbnailUrl, ytId]);

  const finalCategory = customCategory.trim() || category;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 35 * 1024 * 1024) {
      toast.error("Please choose a compressed MP4/WebM under 35MB (or host via YouTube 4K).");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateDescription() {
    if (!title.trim()) {
      toast.error("Enter a Work Title first so Gemini can craft the description.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          category: finalCategory,
          context: videoUrl || fileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gemini API error.");
      } else {
        setDescEn(data.en || "");
        setDescAr(data.ar || "");
        setDescFr(data.fr || "");
        toast.success("Trilingual EN / AR / FR descriptions generated!");
      }
    } catch {
      toast.error("Could not connect to Gemini description service.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Work title is required.");
      return;
    }
    if (sourceType === "youtube" && !ytId) {
      toast.error("Please enter a valid YouTube URL.");
      return;
    }
    if (sourceType === "upload" && !fileBase64) {
      toast.error("Please upload a video file.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          work: {
            title: title.trim(),
            category: finalCategory,
            videoUrl: sourceType === "youtube" ? videoUrl.trim() : "",
            fileBase64: sourceType === "upload" ? fileBase64 : undefined,
            fileName: sourceType === "upload" ? fileName : undefined,
            thumbnailUrl: effectiveThumb,
            publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
            badge: badge.trim(),
            isNewRelease,
            description: { en: descEn, ar: descAr, fr: descFr },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save work.");
        setSaving(false);
        return;
      }
      toast.success("Work added to MadeArt Portfolio!");
      router.push("/works");
    } catch {
      toast.error("Failed to save work.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="p-0 lg:col-span-7">
        <CardHeader className="border-b border-card-border px-6 py-4">
          <CardTitle level={2}>Work Details & Video Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          {/* Source Toggle (YouTube vs Upload ONLY — No Instagram) */}
          <div className="flex gap-2 rounded-xl border border-card-border bg-background-soft-100 p-1">
            <button
              type="button"
              onClick={() => setSourceType("youtube")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                sourceType === "youtube"
                  ? "bg-primary-500 text-white shadow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              YouTube Video Link (Autoplay Muted)
            </button>
            <button
              type="button"
              onClick={() => setSourceType("upload")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                sourceType === "upload"
                  ? "bg-primary-500 text-white shadow"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Upload Video File (uploads/)
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Work Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., YSL — Liquid Obsidian"
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-input-background px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Custom Category (Optional)
              </label>
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Overrides dropdown if filled"
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Publish Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-input-background px-3.5 py-2 text-sm text-text-primary outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {sourceType === "youtube" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  YouTube URL *
                </label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full"
                />
                {ytId && (
                  <p className="mt-1 text-xs text-success-500">
                    Detected YouTube ID: {ytId} · Auto-fetching maxres thumbnail if empty
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Initial Thumbnail URL (Optional)
                </label>
                <Input
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Leave blank to auto-fetch YouTube maxresdefault.jpg"
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">
                Select Video File (MP4 / WebM) *
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleFileChange}
                className="block w-full rounded-lg border border-dashed border-card-border bg-background-soft-100 p-4 text-sm text-text-secondary"
              />
              {fileName && (
                <p className="text-xs text-success-500">
                  Ready to upload to /uploads/: {fileName}
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Thumbnail URL (Optional)
                </label>
                <Input
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://... or leave blank for live looping video card"
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={isNewRelease}
                onChange={(e) => setIsNewRelease(e.target.checked)}
                className="h-4 w-4 rounded border-card-border accent-primary-500"
              />
              Show pulsing NEW RELEASE badge
            </label>

            <div className="flex-1">
              <Input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Optional custom pill (e.g. 4K AI FILM)"
                className="w-full"
              />
            </div>
          </div>

          {/* Gemini Trilingual Description Box */}
          <div className="space-y-3 border-t border-card-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-text-primary">
                AI Trilingual Descriptions
              </span>
              <Button
                type="button"
                variant="primary"
                appearance="outline"
                size="xs"
                isDisabled={aiLoading}
                onPress={handleGenerateDescription}
                className="border px-3 py-1.5"
              >
                {aiLoading ? "Generating..." : "✨ Generate with Gemini AI"}
              </Button>
            </div>
            <TextArea
              rows={2}
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder="English description..."
            />
            <TextArea
              rows={2}
              dir="rtl"
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              placeholder="الوصف باللغة العربية..."
            />
            <TextArea
              rows={2}
              value={descFr}
              onChange={(e) => setDescFr(e.target.value)}
              placeholder="Description en français..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onPress={() => router.push("/works")}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              appearance="fill"
              isDisabled={saving}
              className="px-6 py-2"
            >
              {saving ? "Publishing..." : "Save Work"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Muted Autoplay Preview Card */}
      <Card className="p-0 lg:col-span-5">
        <CardHeader className="border-b border-card-border px-6 py-4">
          <CardTitle level={2}>Live Muted Autoplay Card Preview</CardTitle>
          <Badge color={ytId ? "error" : "blue"} size="sm">
            {sourceType === "youtube" ? "YouTube Muted Loop" : "Local Video Loop"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-card-border bg-black">
            {ytId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1&rel=0&modestbranding=1`}
                allow="autoplay; encrypted-media"
                className="h-full w-full border-0"
                title={title || "YouTube Preview"}
              />
            ) : fileBase64 ? (
              <video
                src={fileBase64}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : effectiveThumb ? (
              <img src={effectiveThumb} alt="Thumbnail" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/50">
                Paste a YouTube link or upload a video to preview muted autoplay playback
              </div>
            )}

            {isNewRelease && (
              <span className="absolute top-3 left-3 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                NEW
              </span>
            )}
          </div>

          <div className="rounded-xl border border-card-border p-4">
            <p className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
              {finalCategory}
            </p>
            <h3 className="mt-1 text-base font-semibold text-text-primary">
              {title || "Untitled Production"}
            </h3>
            {effectiveThumb && (
              <p className="mt-2 truncate text-xs text-text-tertiary">
                Thumbnail: {effectiveThumb}
              </p>
            )}
            {publishAt && (
              <p className="mt-1 text-xs text-warning-500">
                Scheduled for: {new Date(publishAt).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
