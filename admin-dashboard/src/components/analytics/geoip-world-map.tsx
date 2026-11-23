"use client";

import dynamic from "next/dynamic";

const GeoIpWorldMapInner = dynamic(() => import("./geoip-world-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-xl border border-card-border bg-card-background text-sm text-text-tertiary">
      Loading GeoIP World Map...
    </div>
  ),
});

export default function GeoIpWorldMap({
  countryCounts,
}: {
  countryCounts: Record<string, number>;
}) {
  return <GeoIpWorldMapInner countryCounts={countryCounts} />;
}
