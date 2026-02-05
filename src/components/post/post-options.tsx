"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost, updatePost } from "@/actions/post";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PostOptionsProps {
  postId: string;
  userId: string;
  currentUserId?: string;
  caption: string;
  isOwner: boolean;
  className?: string; // 允许从外部控制样式
}

export function PostOptions({
  postId,
  isOwner,
  caption,
  className,
}: PostOptionsProps) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const router = useRouter();

  // 删除逻辑
  const handleDelete = () => {
    startDeleteTransition(async () => {
      const res = await deletePost(postId);
      if (res.success) {
        toast.success("帖子已删除");
        setIsOptionsOpen(false);
        // 如果是在详情页，删除后应该跳转回首页
        window.location.href = "/";
        router.refresh();
      } else {
        toast.error("删除失败，请重试");
      }
    });
  };

  const handleCopyLink = async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/post/${postId}`;

      // 执行复制
      await navigator.clipboard.writeText(url);

      // 1. 先关闭弹窗
      setIsOptionsOpen(false);

      // 2. 弹出成功提示
      toast.success("复制链接成功");
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("复制失败，请重试");
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 text-foreground/80", className)}
        onClick={() => setIsOptionsOpen(true)}
      >
        <MoreHorizontal className="h-5 w-5" />
      </Button>

      {/* 1. 主选项菜单 (Instagram 风格: 居中列表) */}
      <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-xs sm:max-w-sm rounded-xl p-0 gap-0 overflow-hidden border-none bg-background/95 backdrop-blur-sm z-50"
        >
          <DialogTitle className="sr-only">帖子选项</DialogTitle>
          <div className="flex flex-col text-center">
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-none text-red-500 font-bold border-b border-border hover:bg-muted/50"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    setShowDeleteAlert(true);
                  }}
                >
                  删除
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-none font-normal border-b border-border hover:bg-muted/50"
                  onClick={() => {
                    setIsOptionsOpen(false);
                    setShowEditDialog(true);
                  }}
                >
                  编辑
                </Button>
              </>
            )}

            {/* 非作者看到的选项 */}
            {!isOwner && (
              <Button
                variant="ghost"
                className="w-full h-12 rounded-none font-bold border-b border-border hover:bg-muted/50"
                onClick={handleCopyLink}
              >
                复制链接
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full h-12 rounded-none font-normal hover:bg-muted/50"
              onClick={() => setIsOptionsOpen(false)}
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. 删除确认弹窗 */}
      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent className="max-w-xs rounded-xl p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold mb-2">
              删除帖子？
            </DialogTitle>
            <p className="text-sm text-muted-foreground mb-4">
              如果是删除，您将无法恢复此帖子。
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "删除"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteAlert(false)}
              disabled={isDeleting}
            >
              不，保留
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. 编辑帖子弹窗 */}
      <EditPostDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        postId={postId}
        initialCaption={caption}
      />
    </>
  );
}

// 子组件：编辑表单
function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialCaption,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialCaption: string;
}) {
  const [caption, setCaption] = useState(initialCaption);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updatePost(postId, caption);
      if (res.success) {
        toast.success("帖子已更新");
        onOpenChange(false);
      } else {
        toast.error("更新失败");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader className="border-b pb-3 mb-2">
          <DialogTitle className="text-center">编辑信息</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full min-h-[100px] resize-none outline-none text-sm p-2 bg-muted/30 rounded-md focus:bg-muted/50 transition-colors"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="写下你的想法..."
            maxLength={2200}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isPending || caption === initialCaption}
            >
              {isPending ? "保存中..." : "完成"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
