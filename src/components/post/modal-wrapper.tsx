"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";

export function ModalWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [mountedPath] = useState(pathname);

  // Close modal if we navigate away from the path where it was opened
  const showDialog = open && mountedPath === pathname;

  const onDismiss = () => {
    router.back();
  };

  return (
    <Dialog
      defaultOpen={true}
      open={showDialog}
      onOpenChange={(val) => {
        if (!val) {
          setOpen(false);
          onDismiss();
        }
      }}
    >
      <DialogTitle>Post details</DialogTitle>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl w-full p-0 gap-0 bg-transparent border-none shadow-none sm:max-w-5xl overflow-hidden focus:outline-none"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
