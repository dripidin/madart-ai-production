"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import GeoIpWorldMap from "@/components/analytics/geoip-world-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/tailgrids/core/card";

interface MessageItem {
  id: string;
  country: string;
  projectType: string;
  createdAt: string;
}

export default function AnalyticsGeoIpPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);

  useEffect(() => {
    fetch("/api/messages", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setMessages(d))
      .catch(() => {});
  }, []);

  const { countryCounts, topCountriesChart } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of messages) {
      const code = (m.country || "XX").toUpperCase();
      counts[code] = (counts[code] || 0) + 1;
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, submissions]) => ({ country, submissions }));
    return { countryCounts: counts, topCountriesChart: sorted };
  }, [messages]);

  return (
    <div className="mt-6 space-y-6 px-2 lg:px-6">
      <div>
        <h1 className="text-[28px] leading-8 font-semibold text-text-primary">
          GeoIP Analytics & Submissions
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Track where website inquiries originate globally using local geoip-lite resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <GeoIpWorldMap countryCounts={countryCounts} />
        </div>

        <Card className="p-0 lg:col-span-5">
          <CardHeader className="border-b border-card-border px-5 py-4">
            <CardTitle level={2}>Submissions by Country</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {topCountriesChart.length === 0 ? (
              <div className="py-16 text-center text-sm text-text-tertiary">
                No GeoIP submission data recorded yet.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCountriesChart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="country" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="submissions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
