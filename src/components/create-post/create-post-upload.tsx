"use client";

import { useRef } from "react";
import { Images } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_IMAGES = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

interface CreatePostUploadProps {
  onImagesSelected: (files: File[]) => void;
}

export function CreatePostUpload({ onImagesSelected }: CreatePostUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    onImagesSelected(validFiles.slice(0, MAX_IMAGES));
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="relative">
        <Images
          className="h-24 w-24 text-foreground/80 dark:text-foreground"
          strokeWidth={1}
        />
      </div>

      <p className="text-xl font-bold">将照片和视频拖到此处</p>

      <div className="mt-4">
        <Button
          onClick={() => inputRef.current?.click()}
          className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold h-8 text-sm px-4 rounded-md"
        >
          从电脑选择
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
