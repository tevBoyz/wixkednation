"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  exportAdminLeads,
  listAdminLeadCampaigns,
  listAdminLeads,
  type AdminLead,
} from "@/lib/api/admin/leads.api";
import { getErrorMessage } from "@/lib/api/errors";

export const adminLeadsQueryKey = ["admin", "leads"] as const;

const PAGE_SIZE = 25;

function formatLeadDate(value?: string) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return format(date, "MMM d, yyyy h:mm a");
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadLeadsCsv(leads: AdminLead[]) {
  const headers = [
    "email",
    "campaign",
    "source",
    "coupon_code",
    "redeemed",
    "created_at",
  ];
  const lines = [
    headers.join(","),
    ...leads.map((lead) =>
      [
        escapeCsv(lead.email),
        escapeCsv(lead.campaignKey),
        escapeCsv(lead.source),
        escapeCsv(lead.couponCode),
        escapeCsv(lead.redeemed ? "yes" : "no"),
        escapeCsv(lead.createdAt),
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `gas-nation-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminLeadsClient() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [campaignKey, setCampaignKey] = useState("");
  const [sourceInput, setSourceInput] = useState("");
  const [source, setSource] = useState("");
  const [exporting, setExporting] = useState(false);

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      campaignKey: campaignKey || undefined,
      source: source || undefined,
    }),
    [page, search, campaignKey, source],
  );

  const campaignsQuery = useQuery({
    queryKey: [...adminLeadsQueryKey, "campaigns"],
    queryFn: listAdminLeadCampaigns,
  });

  const leadsQuery = useQuery({
    queryKey: [...adminLeadsQueryKey, filters],
    queryFn: () => listAdminLeads(filters),
  });

  const leads = leadsQuery.data?.leads ?? [];
  const pagination = leadsQuery.data?.pagination;
  const total = pagination?.total ?? 0;

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setSource(sourceInput.trim());
    setPage(1);
  }

  async function onExport() {
    setExporting(true);
    try {
      const result = await exportAdminLeads({
        search: search || undefined,
        campaignKey: campaignKey || undefined,
        source: source || undefined,
      });
      if (!result.leads.length) {
        toast.message("No leads to export for these filters");
        return;
      }
      downloadLeadsCsv(result.leads);
      toast.success(
        result.truncated
          ? `Exported first ${result.leads.length} leads (limit reached)`
          : `Exported ${result.leads.length} leads`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not export leads"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Emails captured from claim pages for campaigns. Coupon codes are
            emailed; redemption shows when they order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={() => void onExport()}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
          <Button
            render={<Link href="/admin/coupons" />}
            nativeButton={false}
            variant="outline"
          >
            Coupons
          </Button>
        </div>
      </div>

      <form
        className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={applyFilters}
      >
        <div className="space-y-2">
          <Label htmlFor="lead-search">Email</Label>
          <Input
            id="lead-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="search@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-campaign">Campaign</Label>
          <select
            id="lead-campaign"
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={campaignKey}
            onChange={(e) => {
              setCampaignKey(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All campaigns</option>
            {(campaignsQuery.data ?? []).map((campaign) => (
              <option key={campaign.campaignKey} value={campaign.campaignKey}>
                {campaign.campaignKey} ({campaign.leadCount})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-source">Source</Label>
          <Input
            id="lead-source"
            value={sourceInput}
            onChange={(e) => setSourceInput(e.target.value)}
            placeholder="instagram"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full sm:w-auto">
            Filter
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setSourceInput("");
              setSource("");
              setCampaignKey("");
              setPage(1);
            }}
          >
            Reset
          </Button>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {leadsQuery.isLoading ? "Loading…" : `${total} lead${total === 1 ? "" : "s"}`}
      </p>

      {leadsQuery.isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            {getErrorMessage(leadsQuery.error, "Could not load leads")}
          </p>
          <Button type="button" variant="outline" onClick={() => void leadsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!leadsQuery.isLoading && !leadsQuery.isError && leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No leads yet. Share a claim link from Coupons to start collecting
          emails.
        </p>
      ) : null}

      {leads.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signed up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.email}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {lead.campaignKey}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.source || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {lead.couponCode || "—"}
                  </TableCell>
                  <TableCell>
                    {lead.redeemed ? (
                      <Badge variant="default">Redeemed</Badge>
                    ) : (
                      <Badge variant="secondary">Issued</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatLeadDate(lead.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
