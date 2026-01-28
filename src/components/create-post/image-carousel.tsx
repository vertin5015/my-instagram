"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, Scaling } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider"; // 确保你有安装 shadcn slider 组件
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
  urls: string[];
  step: string; // 传入当前步骤，只有在 'crop' 步骤才显示编辑工具
  className?: string;
}

type AspectRatio = "1/1" | "4/5" | "16/9";

export function ImageCarousel({ urls, step, className }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [aspect, setAspect] = useState<AspectRatio>("1/1");

  // 当切换图片时，重置缩放（可选）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScale(1);
  }, [index]);

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
        "relative flex h-full w-full items-center justify-center bg-[#262626]",
        className
      )}
    >
      {/* 图片视口容器：控制比例 */}
      <div
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-in-out bg-black",
          // 在 crop 阶段应用比例，在 caption 阶段保持 1:1 或上次比例
          // 为了防止布局抖动，这里我们简单处理：crop时响应比例，caption时固定正方形或跟随
          step === "crop" ? "w-full" : "w-full h-full"
        )}
        style={{
          aspectRatio: step === "crop" ? aspect : undefined,
          // 如果不是 crop 阶段，强制填满容器
          height: step === "crop" ? "auto" : "100%",
        }}
      >
        <Image
          src={urls[index]}
          alt={`Preview ${index}`}
          fill
          className="object-cover transition-transform duration-200 ease-out"
          style={{ transform: `scale(${scale})` }}
          priority
          draggable={false} // 防止拖拽图片本身
        />
      </div>

      {/* 导航箭头 (仅在多图时显示) */}
      {urls.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* 底部指示点 */}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
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

      {/* --- 裁剪/缩放工具栏 (仅在 crop 步骤显示) --- */}
      {step === "crop" && (
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          {/* 比例切换 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/70 text-white hover:bg-black/90"
              >
                <Scaling className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-32 bg-black/80 border-none p-1 text-white"
              side="top"
              align="start"
            >
              <div className="flex flex-col text-sm font-medium">
                <button
                  onClick={() => setAspect("1/1")}
                  className={cn(
                    "px-3 py-2 text-left hover:bg-white/20 rounded-sm flex justify-between",
                    aspect === "1/1" && "text-blue-400"
                  )}
                >
                  1:1{" "}
                  <span className="text-xs text-gray-400 opacity-70">
                    Square
                  </span>
                </button>
                <button
                  onClick={() => setAspect("4/5")}
                  className={cn(
                    "px-3 py-2 text-left hover:bg-white/20 rounded-sm border-t border-white/10 flex justify-between",
                    aspect === "4/5" && "text-blue-400"
                  )}
                >
                  4:5{" "}
                  <span className="text-xs text-gray-400 opacity-70">
                    Portrait
                  </span>
                </button>
                <button
                  onClick={() => setAspect("16/9")}
                  className={cn(
                    "px-3 py-2 text-left hover:bg-white/20 rounded-sm border-t border-white/10 flex justify-between",
                    aspect === "16/9" && "text-blue-400"
                  )}
                >
                  16:9{" "}
                  <span className="text-xs text-gray-400 opacity-70">
                    Landscape
                  </span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* 缩放滑块 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full bg-black/70 text-white hover:bg-black/90",
                  scale > 1 && "text-blue-400 bg-white/90 hover:bg-white"
                )}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-40 bg-black/80 border-none px-4 py-3"
              side="top"
              align="start"
            >
              <Slider
                defaultValue={[1]}
                value={[scale]}
                min={1}
                max={2}
                step={0.01}
                onValueChange={(val) => setScale(val[0])}
                className="cursor-pointer"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
