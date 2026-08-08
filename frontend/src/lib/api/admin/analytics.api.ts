import { apiData } from "@/lib/api/client";
import { toQuery } from "@/lib/api/types";

export type AnalyticsTotals = {
  pageViews: number;
  sessions: number;
  uniqueVisitors: number;
};

export type AnalyticsSeriesPoint = {
  date: string;
  pageViews: number;
  sessions: number;
  uniqueVisitors: number;
};

export type AnalyticsTopItem = {
  key: string;
  count: number;
};

export type AnalyticsSummary = {
  range: {
    from: string;
    to: string;
  };
  totals: AnalyticsTotals;
  series: AnalyticsSeriesPoint[];
  topPaths: AnalyticsTopItem[];
  topCountries: AnalyticsTopItem[];
  topSources: AnalyticsTopItem[];
};

export type AnalyticsQuery = {
  from?: string;
  to?: string;
};

export async function getAdminAnalytics(
  params?: AnalyticsQuery,
): Promise<AnalyticsSummary> {
  return apiData<AnalyticsSummary>(`/api/admin/analytics${toQuery(params)}`);
}
