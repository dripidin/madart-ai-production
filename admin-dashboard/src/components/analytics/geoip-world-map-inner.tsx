"use client";

import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import { adminAssetPath } from "@/utils/asset-path";
import { PlusIcon, MinusIcon } from "@/utils/icon";

interface CountryFeature {
  type: "Feature";
  id?: string;
  properties: {
    name: string;
  };
  geometry: GeoJSON.Geometry;
}

const ISO2_TO_GEOJSON_ALIASES: Record<string, string[]> = {
  US: ["USA", "United States", "United States of America"],
  GB: ["England", "United Kingdom", "Great Britain"],
  AE: ["United Arab Emirates"],
  SA: ["Saudi Arabia"],
  KR: ["South Korea", "Republic of Korea"],
  RU: ["Russia", "Russian Federation"],
  DZ: ["Algeria"],
  FR: ["France"],
  DE: ["Germany"],
  JP: ["Japan"],
  CA: ["Canada"],
  AU: ["Australia"],
};

function getDisplayName(code: string): string {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute right-4 bottom-4 z-500 flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-card-background text-text-primary shadow hover:bg-background-soft-100"
        title="Zoom in"
      >
        <PlusIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-card-background text-text-primary shadow hover:bg-background-soft-100"
        title="Zoom out"
      >
        <MinusIcon className="size-4" />
      </button>
    </div>
  );
}

export default function GeoIpWorldMapInner({
  countryCounts,
}: {
  countryCounts: Record<string, number>;
}) {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    name: string;
    count: number | null;
  }>({ visible: false, x: 0, y: 0, name: "", count: null });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(adminAssetPath("/data/world.geojson"))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("local miss"))))
      .then(setGeoData)
      .catch(() => {
        fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
          .then((r) => r.json())
          .then(setGeoData)
          .catch(() => {});
      });
  }, []);

  const nameToCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const [code, count] of Object.entries(countryCounts || {})) {
      const upper = code.toUpperCase();
      if (upper === "XX") continue;
      const dn = getDisplayName(upper);
      map.set(dn.toLowerCase(), (map.get(dn.toLowerCase()) || 0) + count);
      const aliases = ISO2_TO_GEOJSON_ALIASES[upper] || [];
      for (const alias of aliases) {
        map.set(alias.toLowerCase(), (map.get(alias.toLowerCase()) || 0) + count);
      }
    }
    return map;
  }, [countryCounts]);

  const maxCount = useMemo(() => {
    const vals = Object.values(countryCounts || {});
    return Math.max(1, ...vals);
  }, [countryCounts]);

  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    const f = feature as CountryFeature | undefined;
    const name = (f?.properties?.name || "").toLowerCase();
    const fid = (f?.id || "").toLowerCase();
    const count = nameToCount.get(name) ?? nameToCount.get(fid) ?? 0;

    if (count > 0) {
      const ratio = Math.min(1, count / maxCount);
      return {
        fillColor: ratio > 0.6 ? "#2563eb" : ratio > 0.25 ? "#3b82f6" : "#60a5fa",
        weight: 1,
        color: "#1e40af",
        fillOpacity: 0.85,
      };
    }

    return {
      fillColor: "#e2e8f0",
      weight: 0.7,
      color: "#cbd5e1",
      fillOpacity: 0.55,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const f = feature as CountryFeature;
    const displayName = f?.properties?.name || "Unknown";
    const key = displayName.toLowerCase();
    const fid = (f?.id || "").toLowerCase();
    const count = nameToCount.get(key) ?? nameToCount.get(fid) ?? null;

    layer.on({
      mousemove: (e: LeafletMouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: e.originalEvent.clientX - rect.left,
          y: e.originalEvent.clientY - rect.top,
          name: displayName,
          count,
        });
      },
      mouseout: () => {
        setTooltip((t) => ({ ...t, visible: false }));
      },
    });
  };

  return (
    <Card className="p-0">
      <CardHeader className="border-b border-card-border px-5 py-4">
        <CardTitle level={2}>Visitor & Inquiry GeoIP World Map</CardTitle>
        <span className="text-xs text-text-tertiary">Powered by geoip-lite</span>
      </CardHeader>
      <CardContent className="p-4">
        <div
          ref={containerRef}
          className="relative h-80 w-full overflow-hidden rounded-xl border border-card-border bg-background-soft-100"
        >
          {tooltip.visible && (
            <div
              className="pointer-events-none absolute z-600 rounded-lg border border-card-border bg-card-background px-3 py-1.5 text-xs shadow-lg"
              style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
            >
              <span className="font-semibold text-text-primary">{tooltip.name}</span>
              <span className="ml-2 text-text-tertiary">
                {tooltip.count ? `${tooltip.count} inquiries` : "0 inquiries"}
              </span>
            </div>
          )}

          <MapContainer
            center={[20, 10]}
            zoom={1.6}
            minZoom={1}
            maxZoom={6}
            scrollWheelZoom={false}
            attributionControl={false}
            zoomControl={false}
            className="h-full w-full bg-transparent!"
          >
            {geoData && (
              <GeoJSON
                key={JSON.stringify(countryCounts)}
                data={geoData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}
            <ZoomControls />
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
