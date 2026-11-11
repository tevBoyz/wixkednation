"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cancelMyOrder } from "@/lib/api/orders.api";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { formatOrderStatus } from "@/lib/orders/status";
import type { Order, OrderStatus } from "@/lib/api/types";

type CancelOrderDialogProps = {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: (order: Order) => void;
  onStatusConflict?: () => void;
};

export function CancelOrderDialog({
  order,
  open,
  onOpenChange,
  onCancelled,
  onStatusConflict,
}: CancelOrderDialogProps) {
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      cancelMyOrder(order.id, {
        cancelledFromStatus: order.status as Extract<
          OrderStatus,
          "Pending" | "Confirmed" | "OutForDelivery"
        >,
        note: note.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success("Order cancelled");
      onCancelled(result.order);
      onOpenChange(false);
      setNote("");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        onOpenChange(false);
        setNote("");
        onStatusConflict?.();
      }
      toast.error(getErrorMessage(error, "Could not cancel order"));
    },
  });

  const reference = order.orderNumber || order.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending) {
          return;
        }
        onOpenChange(next);
        if (!next) {
          setNote("");
        }
      }}
    >
      <DialogContent showCloseButton={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>Cancel order?</DialogTitle>
          <DialogDescription>
            Cancel <span className="font-medium text-foreground">{reference}</span>{" "}
            while it is{" "}
            <span className="font-medium text-foreground">
              {formatOrderStatus(order.status)}
            </span>
            . This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-note">Reason (optional)</Label>
          <Input
            id="cancel-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tell us why you are cancelling"
            disabled={mutation.isPending}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Keep order
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Cancelling…" : "Cancel order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
