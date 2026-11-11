"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { addressesQueryKey } from "@/components/account/addresses-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createAddress,
  listAddresses,
  type AddressBody,
} from "@/lib/api/addresses.api";
import { getErrorMessage } from "@/lib/api/errors";
import type { Address } from "@/lib/api/types";

function formatAddressLines(address: Address) {
  const cityLine = [
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    address.addressLine1,
    address.addressLine2,
    cityLine,
    address.country,
  ].filter(Boolean);
}

type CheckoutAddressPickerProps = {
  selectedId: string | null;
  onSelect: (addressId: string) => void;
};

export function CheckoutAddressPicker({
  selectedId,
  onSelect,
}: CheckoutAddressPickerProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const autoSelectedRef = useRef(false);

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

  useEffect(() => {
    if (autoSelectedRef.current || selectedId || addresses.length === 0) {
      return;
    }

    const defaultAddress =
      addresses.find((address) => address.isDefault) ?? addresses[0];
    if (defaultAddress) {
      autoSelectedRef.current = true;
      onSelect(defaultAddress.id);
    }
  }, [addresses, onSelect, selectedId]);

  const saveMutation = useMutation({
    mutationFn: (body: AddressBody) => createAddress(body),
    onSuccess: async (address) => {
      await queryClient.invalidateQueries({ queryKey: addressesQueryKey });
      setFormOpen(false);
      onSelect(address.id);
    },
  });

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

  if (addresses.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground">
          Add a delivery address to continue checkout.
        </p>
        <Button type="button" onClick={() => setFormOpen(true)}>
          Add address
        </Button>
        <AddressFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          submitting={saveMutation.isPending}
          onSubmit={async (body) => {
            await saveMutation.mutateAsync(body);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {addresses.map((address) => {
          const checked = selectedId === address.id;

          return (
            <li key={address.id}>
              <label
                className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                  checked
                    ? "border-primary bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="checkout-address"
                  value={address.id}
                  checked={checked}
                  onChange={() => onSelect(address.id)}
                  className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                  aria-label={`Delivery to ${address.label?.trim() || address.fullName}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {address.label?.trim() || address.fullName}
                    </p>
                    {address.isDefault ? <Badge>Default</Badge> : null}
                    {!address.postalCode ? (
                      <Badge variant="outline">ZIP required</Badge>
                    ) : null}
                  </div>
                  {address.label?.trim() ? (
                    <p className="text-sm text-muted-foreground">
                      {address.fullName}
                    </p>
                  ) : null}
                  <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                    {formatAddressLines(address).map((line, index) => (
                      <p key={`${address.id}-${index}`}>{line}</p>
                    ))}
                    <p>{address.phone}</p>
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      <Button type="button" variant="outline" onClick={() => setFormOpen(true)}>
        Add new address
      </Button>

      <AddressFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (saveMutation.isPending) {
            return;
          }
          setFormOpen(open);
        }}
        submitting={saveMutation.isPending}
        onSubmit={async (body) => {
          await saveMutation.mutateAsync(body);
        }}
      />
    </div>
  );
}
