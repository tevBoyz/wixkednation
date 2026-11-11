"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  ADMIN_ORDER_STATUSES,
  formatOrderStatus,
} from "@/lib/orders/status";
import { updateAdminOrderStatus } from "@/lib/api/admin/orders.api";
import { getErrorMessage } from "@/lib/api/errors";
import type { AdminOrder, OrderStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50";

type AdminOrderStatusDialogProps = {
  order: AdminOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (order: AdminOrder) => void;
};

function needsConfirm(status: OrderStatus) {
  return status === "Cancelled" || status === "Delivered";
}

export function AdminOrderStatusDialog({
  order,
  open,
  onOpenChange,
  onUpdated,
}: AdminOrderStatusDialogProps) {
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  const availableStatuses = ADMIN_ORDER_STATUSES.filter(
    (status) => status !== order.status,
  );

  const mutation = useMutation({
    mutationFn: () =>
      updateAdminOrderStatus(order.id, {
        status: nextStatus,
        note: note.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success(
        "Status updated. The customer will receive an in-app notification.",
      );
      onUpdated(result.order);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update order status"));
    },
  });

  function resetForm() {
    setNextStatus("");
    setNote("");
    setConfirmStep(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handlePrimaryAction() {
    if (!nextStatus) {
      toast.error("Choose a new status.");
      return;
    }

    if (needsConfirm(nextStatus) && !confirmStep) {
      setConfirmStep(true);
      return;
    }

    mutation.mutate();
  }

  const confirmLabel =
    nextStatus === "Cancelled"
      ? "Cancel order"
      : nextStatus === "Delivered"
        ? "Mark delivered"
        : "Update status";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update order status</DialogTitle>
          <DialogDescription>
            {order.orderNumber || order.id.slice(0, 8)} is currently{" "}
            {formatOrderStatus(order.status).toLowerCase()}. Customers are
            notified in-app and by email when an email is on file - SMS is not
            sent for status changes.
          </DialogDescription>
        </DialogHeader>

        {confirmStep ? (
          <div className="space-y-3 text-sm">
            <p>
              Confirm changing this order to{" "}
              <span className="font-medium">
                {formatOrderStatus(nextStatus)}
              </span>
              ?
            </p>
            {nextStatus === "Cancelled" ? (
              <p className="text-muted-foreground">
                This cannot be undone from the storefront. The customer will see
                the order as cancelled.
              </p>
            ) : null}
            {nextStatus === "Delivered" ? (
              <p className="text-muted-foreground">
                Marking delivered may update the customer reputation score.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-order-next-status">New status</Label>
              <select
                id="admin-order-next-status"
                className={selectClassName}
                value={nextStatus}
                disabled={mutation.isPending}
                onChange={(event) => {
                  setNextStatus(event.target.value as OrderStatus);
                  setConfirmStep(false);
                }}
              >
                <option value="">Select status…</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatOrderStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-order-status-note">Note (optional)</Label>
              <textarea
                id="admin-order-status-note"
                value={note}
                disabled={mutation.isPending}
                placeholder="Internal note stored in status history…"
                rows={3}
                className={cn(
                  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm",
                )}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {confirmStep ? (
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setConfirmStep(false)}
            >
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          )}
          <Button
            type="button"
            variant={
              nextStatus === "Cancelled" ? "destructive" : "default"
            }
            disabled={mutation.isPending || !nextStatus}
            onClick={() => handlePrimaryAction()}
          >
            {mutation.isPending
              ? "Saving…"
              : confirmStep
                ? confirmLabel
                : needsConfirm(nextStatus)
                  ? "Continue"
                  : "Update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
