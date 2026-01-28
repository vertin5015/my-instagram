"use client";

import { useRef, useState } from "react";
import { ImagePlus, Images, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";

const MAX_IMAGES = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

interface CreatePostUploadProps {
  onImagesSelected: (files: File[]) => void;
}

export function CreatePostUpload({ onImagesSelected }: CreatePostUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false); // 新增压缩状态

  // 压缩配置
  const compressionOptions = {
    maxSizeMB: 1, // 目标最大体积 (MB)
    maxWidthOrHeight: 1920, // 限制最大分辨率 (1080p/2K 足够了)
    useWebWorker: true, // 使用 WebWorker 避免卡顿主线程
    fileType: "image/jpeg", // 统一转为 jpeg 格式 (兼容性最好，压缩率高)
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    // 1. 基础筛选
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (validFiles.length === 0) return;

    const trimmedFiles = validFiles.slice(0, MAX_IMAGES);

    try {
      setIsCompressing(true); // 开启 Loading

      // 2. 并发压缩所有图片
      const compressedFilesPromises = trimmedFiles.map(async (file) => {
        //如果是 GIF 通常不压缩以免失去动效，或者单独处理
        if (file.type === "image/gif") return file;

        try {
          // 执行压缩
          const compressedBlob = await imageCompression(
            file,
            compressionOptions
          );
          // 将 Blob 转回 File 对象 (保持原名，方便后续处理)
          return new File([compressedBlob], file.name, {
            type: compressedBlob.type,
            lastModified: Date.now(),
          });
        } catch (error) {
          console.error("Compression failed for:", file.name, error);
          return file; // 如果压缩失败，使用原图降级处理
        }
      });

      const compressedFiles = await Promise.all(compressedFilesPromises);

      // 3. 将处理后的文件传给父组件
      onImagesSelected(compressedFiles);
    } catch (error) {
      console.error("Batch processing failed", error);
    } finally {
      setIsCompressing(false); // 关闭 Loading
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ""; // 重置 input 以便重复选择同一文件
  };

  // 拖拽处理
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompressing) return; // 处理中禁止拖拽
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-4 p-8 text-center transition-colors",
        isCompressing ? "cursor-wait opacity-70" : "cursor-default"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="relative flex flex-col items-center justify-center">
        {isCompressing ? (
          // 处理中的 Loading 状态
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <Loader2 className="h-16 w-16 text-[#0095f6] animate-spin" />
            <p className="text-lg font-medium text-muted-foreground">
              正在处理图片...
            </p>
          </div>
        ) : (
          // 正常的上传界面
          <>
            <Images
              className="h-24 w-24 text-foreground/80 dark:text-foreground mb-4"
              strokeWidth={1}
            />
            <p className="text-xl font-light">将照片和视频拖到此处</p>
            <div className="mt-6">
              <Button
                onClick={() => inputRef.current?.click()}
                className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold h-8 text-sm px-4 rounded-md"
              >
                从电脑选择
              </Button>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={handleChange}
        className="hidden"
        disabled={isCompressing}
      />
    </div>
  );
}
