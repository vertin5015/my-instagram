"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  urls: string[];
  aspectRatio?: "square" | "original"; // Ins 通常默认方形，这里支持扩展
  className?: string;
}

export function ImageCarousel({ urls, className }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i <= 0 ? urls.length - 1 : i - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i >= urls.length - 1 ? 0 : i + 1));
  };

  if (urls.length === 0) return null;

  return (
    <div
      className={cn(
        "relative w-full h-full bg-black flex items-center justify-center",
        className
      )}
    >
      {/* 图片容器 */}
      <div className="relative w-full h-full">
        <Image
          src={urls[index]}
          alt={`Preview ${index}`}
          fill
          className="object-cover" // 保持填充，类似于 Ins 的裁切效果
          priority
        />
      </div>

      {/* 导航箭头 (仅在多图时显示) */}
      {urls.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* 底部指示点 */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {urls.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all shadow-sm",
                  i === index ? "w-1.5 bg-white" : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
