"use client";

import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import Image from "next/image";
import Cropper, { Area } from "react-easy-crop";
import { ChevronLeft, ChevronRight, ZoomIn, Scaling } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// 定义传输给后端的数据结构
export type ImageCropData = {
  url: string; // 标识是哪张图
  crop: Area; // 像素裁剪区域 { x, y, width, height }
};

interface ImageCarouselProps {
  urls: string[];
  step: string;
  className?: string;
}

// 暴露给父组件的方法接口
export interface CarouselRef {
  getCropData: () => ImageCropData[];
}

export const ImageCarousel = forwardRef<CarouselRef, ImageCarouselProps>(
  ({ urls, step, className }, ref) => {
    const [index, setIndex] = useState(0);

    // Cropper 的 UI 状态
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // --- 修改点 1: 这里直接使用 number 类型，不要用 Union 类型 ---
    // react-easy-crop 接受任意数字作为比例 (例如 4/5 即 0.8)
    const [aspect, setAspect] = useState<number>(1);

    // 存储每张图片的“最终像素裁剪区域”
    const [cropMap, setCropMap] = useState<Record<number, Area>>({});

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      // 切换图片时，通常保持用户选择的裁剪比例 (aspect)，不需要重置
    }, [index]);

    const onCropComplete = useCallback(
      (_: Area, croppedAreaPixels: Area) => {
        setCropMap((prev) => ({ ...prev, [index]: croppedAreaPixels }));
      },
      [index]
    );

    useImperativeHandle(ref, () => ({
      getCropData: () => {
        return urls.map((url, i) => ({
          url: url,
          crop: cropMap[i] || { x: 0, y: 0, width: 0, height: 0 },
        }));
      },
    }));

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
        <div className={cn("relative w-full h-full bg-black overflow-hidden")}>
          {step === "crop" ? (
            <Cropper
              image={urls[index]}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              showGrid={true}
              objectFit="contain"
            />
          ) : (
            <Image
              src={urls[index]}
              alt={`Preview ${index}`}
              fill
              className="object-contain"
              priority
            />
          )}
        </div>

        {urls.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
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

        {step === "crop" && (
          <div className="absolute bottom-4 left-4 z-30 flex gap-2">
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
                  {/* --- 修改点 2: 在点击时直接传入计算后的数字 --- */}
                  <button
                    onClick={() => setAspect(1)}
                    className={cn(
                      "px-3 py-2 text-left hover:bg-white/20 rounded-sm flex justify-between",
                      aspect === 1 && "text-blue-400"
                    )}
                  >
                    1:1{" "}
                    <span className="text-xs text-gray-400 opacity-70">
                      Square
                    </span>
                  </button>
                  <button
                    onClick={() => setAspect(4 / 5)}
                    className={cn(
                      "px-3 py-2 text-left hover:bg-white/20 rounded-sm border-t border-white/10 flex justify-between",
                      // 这里比较时，由于浮点数精度问题，建议用近似比较，或者直接保存一个 activeAspectKey 状态来控制高亮
                      // 这里简单处理：0.8 === 4/5
                      aspect === 4 / 5 && "text-blue-400"
                    )}
                  >
                    4:5{" "}
                    <span className="text-xs text-gray-400 opacity-70">
                      Portrait
                    </span>
                  </button>
                  <button
                    onClick={() => setAspect(16 / 9)}
                    className={cn(
                      "px-3 py-2 text-left hover:bg-white/20 rounded-sm border-t border-white/10 flex justify-between",
                      aspect === 16 / 9 && "text-blue-400"
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

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full bg-black/70 text-white hover:bg-black/90",
                    zoom > 1 && "text-blue-400 bg-white/90 hover:bg-white"
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
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(val) => setZoom(val[0])}
                  className="cursor-pointer"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    );
  }
);

ImageCarousel.displayName = "ImageCarousel";
