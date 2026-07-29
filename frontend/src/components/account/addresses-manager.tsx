"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
  type AddressBody,
} from "@/lib/api/addresses.api";
import { getErrorMessage } from "@/lib/api/errors";
import type { Address } from "@/lib/api/types";

export const addressesQueryKey = ["addresses", "me"] as const;

function formatAddressLines(address: Address) {
  return [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
}

export function AddressesManager() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);

  const {
    data: addresses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: listAddresses,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { body: AddressBody; id?: string }) => {
      if (payload.id) {
        return updateAddress(payload.id, payload.body);
      }
      return createAddress(payload.body);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: addressesQueryKey });
      setFormOpen(false);
      setEditing(null);
      toast.success(variables.id ? "Address updated" : "Address added");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Could not save address"));
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (addressId: string) =>
      updateAddress(addressId, { isDefault: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: addressesQueryKey });
      toast.success("Default address updated");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Could not set default address"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: addressesQueryKey });
      setDeleting(null);
      toast.success("Address deleted");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Could not delete address"));
    },
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setFormOpen(true);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading addresses…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {getErrorMessage(error, "Could not load addresses")}
        </p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {addresses.length === 0
            ? "No saved addresses yet."
            : `${addresses.length} saved address${addresses.length === 1 ? "" : "es"}`}
        </p>
        <Button type="button" onClick={openCreate}>
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Add a delivery address before checkout.
          </p>
          <Button type="button" className="mt-4" onClick={openCreate}>
            Add your first address
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {address.label?.trim() || address.fullName}
                  </p>
                  {address.label?.trim() ? (
                    <p className="text-sm text-muted-foreground">
                      {address.fullName}
                    </p>
                  ) : null}
                </div>
                {address.isDefault ? <Badge>Default</Badge> : null}
              </div>

              <div className="space-y-0.5 text-sm text-muted-foreground">
                {formatAddressLines(address).map((line, index) => (
                  <p key={`${address.id}-${index}`}>{line}</p>
                ))}
                <p>{address.phone}</p>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(address)}
                >
                  Edit
                </Button>
                {!address.isDefault ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={defaultMutation.isPending}
                    onClick={() => defaultMutation.mutate(address.id)}
                  >
                    Set default
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleting(address)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (saveMutation.isPending) {
            return;
          }
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
        address={editing}
        submitting={saveMutation.isPending}
        onSubmit={async (body) => {
          await saveMutation.mutateAsync({
            body,
            id: editing?.id,
          });
        }}
      />

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (deleteMutation.isPending) {
            return;
          }
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <DialogContent showCloseButton={!deleteMutation.isPending}>
          <DialogHeader>
            <DialogTitle>Delete address?</DialogTitle>
            <DialogDescription>
              This removes{" "}
              <span className="font-medium text-foreground">
                {deleting?.label?.trim() || deleting?.fullName}
              </span>{" "}
              from your saved addresses. You can add it again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending || !deleting}
              onClick={() => {
                if (deleting) {
                  deleteMutation.mutate(deleting.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
