"use client";

import { useCallback, useRef } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export interface CreatePostUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxCount?: number;
  className?: string;
}

export function CreatePostUpload({
  onImagesSelected,
  maxCount = MAX_IMAGES,
  className,
}: CreatePostUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith("image/")
      );
      const trimmed = files.slice(0, maxCount);
      onImagesSelected(trimmed);
    },
    [onImagesSelected, maxCount]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 min-h-[400px] cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4">
        <ImagePlus className="h-12 w-12 text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground">
        将照片和视频拖到此处，或点击选择
      </p>
      <p className="text-sm text-muted-foreground">
        最多可选择 {maxCount} 张图片
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={handleChange}
        className="sr-only"
        aria-hidden
      />
    </div>
  );
}
