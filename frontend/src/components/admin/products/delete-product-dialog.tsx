"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/lib/api/types";

type DeleteProductDialogProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting?: boolean;
  onConfirm: () => void;
};

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  deleting = false,
  onConfirm,
}: DeleteProductDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (deleting) {
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>Delete product?</DialogTitle>
          <DialogDescription>
            Soft-delete{" "}
            <span className="font-medium text-foreground">{product?.name}</span>.
            It will be hidden from the storefront. You can restore it later from
            the products list.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting || !product}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : "Delete product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
