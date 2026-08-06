"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AdminSettingsNav } from "@/components/admin/settings/admin-settings-nav";
import { getSmsLogs, sendTestSms } from "@/lib/api/admin/sms.api";
import { getErrorMessage } from "@/lib/api/errors";
import {
  formatSmsLogMessage,
  getSmsLogPurpose,
} from "@/lib/admin/sms-log";
import { normalizePhone, toUsE164 } from "@/lib/phone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UsPhoneInput,
  usPhoneLocalSchema,
} from "@/components/ui/us-phone-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const selectClassName =
  "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

const testSmsSchema = z.object({
  phone: usPhoneLocalSchema(),
  message: z.string().max(500, "Message is too long").optional(),
});

function formatLogDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "MMM d, yyyy · h:mm a");
}

function LogsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

function AdminSmsContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const phoneFilter = searchParams.get("phone")?.trim() || undefined;
  const statusFilter = searchParams.get("status")?.trim() || undefined;

  const testForm = useForm<z.infer<typeof testSmsSchema>>({
    resolver: zodResolver(testSmsSchema),
    defaultValues: { phone: "", message: "" },
  });

  const logsQuery = useQuery({
    queryKey: ["admin", "sms", "logs", { page, phoneFilter, statusFilter }],
    queryFn: () =>
      getSmsLogs({
        page,
        limit: PAGE_SIZE,
        phone: phoneFilter,
        status: statusFilter,
      }),
    staleTime: 0,
  });

  const testMutation = useMutation({
    mutationFn: (values: z.infer<typeof testSmsSchema>) =>
      sendTestSms({
        phone: normalizePhone(values.phone),
        message: values.message?.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "sms", "logs"] });
      toast.success("Test SMS sent");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not send test SMS"));
    },
  });

  const pagination = logsQuery.data?.pagination;
  const logs = logsQuery.data?.logs ?? [];

  function buildLogsHref(next: {
    page?: number;
    phone?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    const nextPage = next.page ?? page;
    const phone = next.phone === undefined ? phoneFilter : next.phone || undefined;
    const status =
      next.status === undefined ? statusFilter : next.status || undefined;

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    if (phone) {
      params.set("phone", phone);
    }
    if (status) {
      params.set("status", status);
    }

    const qs = params.toString();
    return qs ? `/admin/settings/sms?${qs}` : "/admin/settings/sms";
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Configuration</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          SMS test & logs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a test message and review delivery logs. OTP content is never
          shown in the UI.
        </p>
      </div>

      <AdminSettingsNav />

      <section className="space-y-4 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-lg font-medium">Send test SMS</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Uses the backend SMS provider (mock in development).
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={testForm.handleSubmit((values) => {
            testMutation.mutate({
              ...values,
              phone: normalizePhone(toUsE164(values.phone)),
            });
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-sms-phone">Phone</Label>
              <Controller
                control={testForm.control}
                name="phone"
                render={({ field }) => (
                  <UsPhoneInput
                    id="test-sms-phone"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={testMutation.isPending}
                    aria-invalid={Boolean(testForm.formState.errors.phone)}
                  />
                )}
              />
              {testForm.formState.errors.phone ? (
                <p className="text-sm text-destructive">
                  {testForm.formState.errors.phone.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="test-sms-message">Message (optional)</Label>
              <Input
                id="test-sms-message"
                placeholder="Defaults to backend test message"
                disabled={testMutation.isPending}
                {...testForm.register("message")}
              />
            </div>
          </div>
          <Button type="submit" disabled={testMutation.isPending}>
            {testMutation.isPending ? "Sending…" : "Send test SMS"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">SMS logs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pagination?.total ?? logs.length} log
              {(pagination?.total ?? logs.length) === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className={cn(selectClassName, "w-auto min-w-[8rem]")}
              value={statusFilter || ""}
              disabled={isPending}
              onChange={(event) => {
                startTransition(() => {
                  router.push(
                    buildLogsHref({
                      page: 1,
                      status: event.target.value,
                    }),
                  );
                });
              }}
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {logsQuery.isLoading ? <LogsSkeleton /> : null}

        {logsQuery.isError ? (
          <p className="text-sm text-destructive">
            {getErrorMessage(logsQuery.error, "Could not load SMS logs")}
          </p>
        ) : null}

        {logsQuery.data && logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No SMS logs found.</p>
        ) : null}

        {logs.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const purpose = getSmsLogPurpose(log) || "-";
                  const failed = log.status?.toLowerCase() === "failed";

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        {formatLogDate(log.createdAt)}
                      </TableCell>
                      <TableCell>{log.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{purpose}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={failed ? "destructive" : "secondary"}>
                          {log.status || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.provider || "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {formatSmsLogMessage(log)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {pagination && pagination.totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  {pagination.page > 1 ? (
                    <Button
                      render={
                        <Link
                          href={buildLogsHref({ page: pagination.page - 1 })}
                        />
                      }
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                  ) : null}
                  {pagination.page < pagination.totalPages ? (
                    <Button
                      render={
                        <Link
                          href={buildLogsHref({ page: pagination.page + 1 })}
                        />
                      }
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

export function AdminSmsClient() {
  return (
    <Suspense fallback={<LogsSkeleton />}>
      <AdminSmsContent />
    </Suspense>
  );
}
