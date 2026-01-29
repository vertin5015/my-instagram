// components/ui/modal-wrapper.tsx
"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog"; // 使用 shadcn 的 Dialog

export function ModalWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back(); // 关闭时回退路由
    }
  };

  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      {/* 注意：移除 max-w，使用自定义类名来适应 Instagram 的大尺寸 */}
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none w-auto flex justify-center outline-none">
        <DialogTitle className="sr-only">Post Details</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
