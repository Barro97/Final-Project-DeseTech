import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/atoms/dialog";
import { createPortal } from "react-dom";

interface BatchDeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
}

export function BatchDeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: BatchDeleteConfirmationDialogProps) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!bg-background !bg-opacity-100"
        style={{
          opacity: 1,
          backgroundColor: "var(--background)",
          backdropFilter: "none",
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete Selected Datasets</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedCount} selected dataset
            {selectedCount > 1 ? "s" : ""}? This action cannot be undone and
            will permanently remove{" "}
            {selectedCount > 1 ? "these datasets" : "this dataset"}
            and all associated files.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end space-x-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Delete {selectedCount} Dataset{selectedCount > 1 ? "s" : ""}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
    document.body
  );
}
