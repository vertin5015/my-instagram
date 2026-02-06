"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";

export function ModalWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const onDismiss = () => {
    router.back();
  };

  return (
    <Dialog
      defaultOpen={true}
      open={true}
      onOpenChange={(open) => !open && onDismiss()}
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
