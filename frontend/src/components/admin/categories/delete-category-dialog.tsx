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
import type { Category } from "@/lib/api/types";

type DeleteCategoryDialogProps = {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting?: boolean;
  onConfirm: () => void;
};

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  deleting = false,
  onConfirm,
}: DeleteCategoryDialogProps) {
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
          <DialogTitle>Delete category?</DialogTitle>
          <DialogDescription>
            Soft-delete{" "}
            <span className="font-medium text-foreground">
              {category?.name}
            </span>
            . It will be hidden from the storefront and marked inactive. You
            can restore it later from this list.
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
            disabled={deleting || !category}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : "Delete category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
