"use client";

import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminAnalytics,
  type AnalyticsTopItem,
} from "@/lib/api/admin/analytics.api";
import { getErrorMessage } from "@/lib/api/errors";

export const adminAnalyticsQueryKey = ["admin", "analytics"] as const;

type RangePreset = "7d" | "30d";

function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function TopTable({
  title,
  rows,
  emptyLabel,
  mono = true,
}: {
  title: string;
  rows: AnalyticsTopItem[];
  emptyLabel: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${title}-${row.key}`}>
                <TableCell
                  className={`max-w-[16rem] text-xs sm:text-sm ${
                    mono ? "truncate font-mono" : "whitespace-normal"
                  }`}
                >
                  {row.key}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.count.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function AdminAnalyticsClient() {
  const [preset, setPreset] = useState<RangePreset>("7d");
  const range = useMemo(() => {
    const to = new Date();
    const from = subDays(to, preset === "7d" ? 6 : 29);
    return { from: toDateInput(from), to: toDateInput(to) };
  }, [preset]);

  const analyticsQuery = useQuery({
    queryKey: [...adminAnalyticsQueryKey, range],
    queryFn: () => getAdminAnalytics(range),
    staleTime: 30_000,
  });

  const data = analyticsQuery.data;
  const maxPageViews = Math.max(
    1,
    ...(data?.series.map((point) => point.pageViews) ?? [1]),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Traffic</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            First-party visitors, locations, and traffic sources.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={preset === "7d" ? "default" : "outline"}
            onClick={() => setPreset("7d")}
          >
            Last 7 days
          </Button>
          <Button
            type="button"
            size="sm"
            variant={preset === "30d" ? "default" : "outline"}
            onClick={() => setPreset("30d")}
          >
            Last 30 days
          </Button>
        </div>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : null}

      {analyticsQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(analyticsQuery.error, "Could not load analytics")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void analyticsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Unique visitors"
              value={data.totals.uniqueVisitors}
              hint={`${range.from} → ${range.to}`}
            />
            <StatCard label="Sessions" value={data.totals.sessions} />
            <StatCard label="Page views" value={data.totals.pageViews} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Daily activity</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Uniques</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="min-w-[8rem]">Page views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.series.map((point) => (
                  <TableRow key={point.date}>
                    <TableCell>{point.date}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {point.uniqueVisitors}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {point.sessions}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                          <div
                            className="h-full rounded bg-primary"
                            style={{
                              width: `${Math.round(
                                (point.pageViews / maxPageViews) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                          {point.pageViews}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <TopTable
              title="Top pages"
              rows={data.topPaths}
              emptyLabel="No page views in this range."
            />
            <TopTable
              title="Top countries"
              rows={data.topCountries}
              emptyLabel="No location data yet."
              mono={false}
            />
            <TopTable
              title="Top sources"
              rows={data.topSources}
              emptyLabel="No source data yet."
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
