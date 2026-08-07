"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  createAdminTeamMember,
  demoteAdminTeamMember,
  disableAdminTeamMember,
  listAdminTeam,
  restoreAdminTeamMember,
  type TeamMember,
} from "@/lib/api/admin/team.api";
import { getErrorMessage } from "@/lib/api/errors";
import { isSuperAdminRole } from "@/lib/auth/redirect";

export const adminTeamQueryKey = ["admin", "team"] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return format(date, "MMM d, yyyy");
}

function TeamSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function AdminTeamClient() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSuperadmin = isSuperAdminRole(user?.role);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [lastCredentials, setLastCredentials] = useState<{
    email: string;
    pin: string;
  } | null>(null);

  useEffect(() => {
    if (user && !isSuperadmin) {
      router.replace("/admin");
    }
  }, [user, isSuperadmin, router]);

  const teamQuery = useQuery({
    queryKey: adminTeamQueryKey,
    queryFn: listAdminTeam,
    staleTime: 0,
    enabled: isSuperadmin,
  });

  const createMutation = useMutation({
    mutationFn: createAdminTeamMember,
    onSuccess: (data) => {
      setLastCredentials(data.credentials);
      setEmail("");
      setPin("");
      setName("");
      toast.success("Admin created — copy credentials now");
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not create admin"));
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableAdminTeamMember,
    onSuccess: () => {
      toast.success("Account disabled");
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not disable account"));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreAdminTeamMember,
    onSuccess: () => {
      toast.success("Account restored");
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not restore account"));
    },
  });

  const demoteMutation = useMutation({
    mutationFn: demoteAdminTeamMember,
    onSuccess: () => {
      toast.success("Demoted to customer");
      void queryClient.invalidateQueries({ queryKey: adminTeamQueryKey });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not demote account"));
    },
  });

  if (!isSuperadmin) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  const items = teamQuery.data?.items ?? [];
  const busy =
    createMutation.isPending ||
    disableMutation.isPending ||
    restoreMutation.isPending ||
    demoteMutation.isPending;

  function onCreate(event: React.FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPin = pin.trim();
    if (!trimmedEmail || !/^\d{4,6}$/.test(trimmedPin)) {
      toast.error("Email and a 4–6 digit PIN are required");
      return;
    }
    createMutation.mutate({
      email: trimmedEmail,
      pin: trimmedPin,
      name: name.trim() || undefined,
    });
  }

  async function copyCredentials() {
    if (!lastCredentials) {
      return;
    }
    const text = `${lastCredentials.email}\n${lastCredentials.pin}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Credentials copied");
    } catch {
      toast.error("Could not copy — select the text manually");
    }
  }

  function canActOn(member: TeamMember) {
    return member.id !== user?.id;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">Superadmin</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create ops admins with email + PIN. Superadmins keep full admin access
          plus this page.
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="grid max-w-xl gap-4 rounded-lg border border-border p-4 sm:p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="team-email">Email</Label>
          <Input
            id="team-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ops@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-pin">PIN (4–6 digits)</Label>
          <Input
            id="team-pin"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="654321"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="team-name">Name (optional)</Label>
          <Input
            id="team-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ops Admin"
          />
        </div>
        <Button type="submit" disabled={busy}>
          {createMutation.isPending ? "Creating…" : "Create admin"}
        </Button>
      </form>

      {lastCredentials ? (
        <div className="max-w-xl space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">Share these credentials once</p>
          <p className="font-mono text-sm">
            {lastCredentials.email}
            <br />
            PIN: {lastCredentials.pin}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyCredentials()}>
            Copy
          </Button>
        </div>
      ) : null}

      {teamQuery.isLoading ? <TeamSkeleton /> : null}

      {teamQuery.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(teamQuery.error, "Could not load team")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void teamQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {teamQuery.data ? (
        <>
          <p className="text-sm text-muted-foreground">
            {teamQuery.data.total} staff member
            {teamQuery.data.total === 1 ? "" : "s"}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((member) => {
                const disabled = Boolean(member.isDisabled || member.deletedAt);
                const self = !canActOn(member);
                return (
                  <TableRow key={member.id}>
                    <TableCell>{member.name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs sm:text-sm">
                      {member.email || "—"}
                    </TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    <TableCell>{disabled ? "Disabled" : "Active"}</TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {self ? (
                        <span className="text-xs text-muted-foreground">You</span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          {disabled ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => restoreMutation.mutate(member.id)}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Disable ${member.email || member.name || "this account"}?`,
                                  )
                                ) {
                                  disableMutation.mutate(member.id);
                                }
                              }}
                            >
                              Disable
                            </Button>
                          )}
                          {member.role === "admin" && !disabled ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Demote ${member.email || "this admin"} to customer?`,
                                  )
                                ) {
                                  demoteMutation.mutate(member.id);
                                }
                              }}
                            >
                              Demote
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      ) : null}
    </div>
  );
}
