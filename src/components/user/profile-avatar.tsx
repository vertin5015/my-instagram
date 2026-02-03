"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { updateProfileImage, removeProfileImage } from "@/actions/profile";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  user: {
    username: string | null;
    image: string | null;
  };
  isCurrentUser: boolean;
}

export function ProfileAvatar({ user, isCurrentUser }: ProfileAvatarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 压缩配置 (与你提供的代码一致)
  const compressionOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 500,
    useWebWorker: true,
    fileType: "image/jpeg",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // 关闭 Modal，显示 Loading 状态通常体现在 Toast 或头像上，这里简单处理
    setIsModalOpen(false);

    try {
      // 1. 压缩图片
      const compressedBlob = await imageCompression(file, compressionOptions);
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
      });

      // 2. 构建 FormData
      const formData = new FormData();
      formData.append("file", compressedFile);

      // 3. 调用 Server Action
      const res = await updateProfileImage(formData);

      if (res.success) {
        toast.success("头像已更新");
      } else {
        toast.error("更新失败");
      }
    } catch (error) {
      console.error(error);
      toast.error("处理图片时出错");
    } finally {
      setIsUploading(false);
      // 清空 input 允许再次选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setIsModalOpen(false);
    startTransition(async () => {
      const res = await removeProfileImage();
      if (res.success) {
        toast.success("头像已移除");
      } else {
        toast.error("操作失败");
      }
    });
  };

  // 如果不是当前用户，只展示图片，不具备点击功能
  if (!isCurrentUser) {
    return (
      <div className="rounded-full p-[3px] bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600">
        <div className="rounded-full bg-background p-[2px]">
          <Image
            src={user.image || "/avatar-default.png"}
            alt={user.username || "avatar"}
            width={150}
            height={150}
            className="h-24 w-24 sm:h-[150px] sm:w-[150px] rounded-full object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 触发器：可点击的头像 */}
      <div
        onClick={() => !isUploading && setIsModalOpen(true)}
        className={cn(
          "rounded-full p-[3px] bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 cursor-pointer group relative",
          isUploading && "opacity-70 pointer-events-none"
        )}
        title="更换头像"
      >
        <div className="rounded-full bg-background p-[2px] relative overflow-hidden">
          <Image
            src={user.image || "/avatar-default.png"}
            alt={user.username || "avatar"}
            width={150}
            height={150}
            className={cn(
              "h-24 w-24 sm:h-[150px] sm:w-[150px] rounded-full object-cover transition-opacity",
              "group-hover:opacity-90"
            )}
            priority
            unoptimized={process.env.NODE_ENV === "development"}
          />
          {/* 上传中的 Loading 遮罩 */}
          {(isUploading || isPending) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 仿 Instagram 的模态框 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-xl p-0 gap-0 overflow-hidden border-none bg-background/95 backdrop-blur-sm">
          <DialogHeader className="py-6 border-b border-border">
            <DialogTitle className="text-center text-lg font-normal">
              更换头像
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col">
            {/* 上传照片按钮 */}
            <Button
              variant="ghost"
              className="w-full h-12 rounded-none text-blue-500 font-bold border-b border-border hover:bg-muted/50 focus:ring-0"
              onClick={() => fileInputRef.current?.click()}
            >
              上传照片
            </Button>

            {/* 移除当前照片按钮 (只有当前有头像时显示) */}
            {user.image && (
              <Button
                variant="ghost"
                className="w-full h-12 rounded-none text-red-500 font-bold border-b border-border hover:bg-muted/50 focus:ring-0"
                onClick={handleRemovePhoto}
              >
                移除当前照片
              </Button>
            )}

            {/* 取消按钮 */}
            <Button
              variant="ghost"
              className="w-full h-12 rounded-none font-normal hover:bg-muted/50 focus:ring-0"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
