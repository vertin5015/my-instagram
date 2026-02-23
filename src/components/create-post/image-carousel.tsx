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

// 这个组件负责在“创建帖子”流程中展示图片轮播 & 裁剪功能
// - step === "crop" 时：使用 react-easy-crop 提供裁剪交互，记录每张图片的裁剪像素区域
// - 其他 step：只展示图片预览（左右切换、多图指示器）
// - 通过 forwardRef 暴露 getCropData 给父组件，用于在提交时拿到所有图片的裁剪数据

// 定义传输给父组件 / 后端的数据结构
export type ImageCropData = {
  url: string; // 标识是哪张图（对应的预览 URL）
  crop: Area; // 像素裁剪区域 { x, y, width, height }，通常来自 react-easy-crop 的 croppedAreaPixels
};

interface ImageCarouselProps {
  urls: string[]; // 当前要展示 / 裁剪的所有图片 URL
  step: string; // 当前处于创建流程的哪个 step（决定是否显示裁剪 UI）
  className?: string;
}

// 暴露给父组件的 ref 接口：父组件可以调用 ref.current.getCropData() 获取全部图片的裁剪数据
export interface CarouselRef {
  getCropData: () => ImageCropData[];
}

export const ImageCarousel = forwardRef<CarouselRef, ImageCarouselProps>(
  ({ urls, step, className }, ref) => {
    // 当前正在查看 / 操作的是第几张图片
    const [index, setIndex] = useState(0);

    // Cropper 的交互状态：平移 (crop) + 缩放 (zoom)
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    // 裁剪比例，react-easy-crop 接受 number 类型（例如 4/5 即 0.8）
    const [aspect, setAspect] = useState<number>(1);

    // 存储每张图片的“最终像素裁剪区域”：key 为图片索引，值为 Area
    const [cropMap, setCropMap] = useState<Record<number, Area>>({});

    // 当切换图片时，重置当前 Cropper 的平移 / 缩放，保持比例不变
    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      // 用户选择的 aspect 比例通常需要跨图片复用，因此这里不重置 aspect
    }, [index]);

    // 每次拖动 / 缩放结束后，react-easy-crop 会回调 onCropComplete，给出像素级裁剪结果
    const onCropComplete = useCallback(
      (_: Area, croppedAreaPixels: Area) => {
        // 将当前图片 index 对应的像素区域记录下来，后续提交时统一取 cropMap
        setCropMap((prev) => ({ ...prev, [index]: croppedAreaPixels }));
      },
      [index]
    );

    // 通过 ref 暴露 getCropData 方法给父组件
    useImperativeHandle(ref, () => ({
      getCropData: () => {
        // 保证返回的数组顺序与 urls 一致
        // 如果某张图片还没有裁剪记录，则返回一个 width/height 为 0 的默认值，表示“未裁剪”
        return urls.map((url, i) => ({
          url: url,
          crop: cropMap[i] || { x: 0, y: 0, width: 0, height: 0 },
        }));
      },
    }));

    // 切换到上一张图片（循环切换）
    const prev = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIndex((i) => (i <= 0 ? urls.length - 1 : i - 1));
    };

    // 切换到下一张图片（循环切换）
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
        {/* 主画布区域：根据 step 决定展示 Cropper 还是静态 Image */}
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

        {/* 底部圆点 + 左右切换按钮：多图时才展示 */}
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

        {/* 仅在裁剪步骤显示：裁剪比例选择 + 缩放控制 */}
        {step === "crop" && (
          <div className="absolute bottom-4 left-4 z-30 flex gap-2">
            {/* 裁剪比例选择 Popover */}
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
                  {/* 1:1 正方形 */}
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
                  {/* 4:5 纵向（常见于 Instagram） */}
                  <button
                    onClick={() => setAspect(4 / 5)}
                    className={cn(
                      "px-3 py-2 text-left hover:bg-white/20 rounded-sm border-t border-white/10 flex justify-between",
                      aspect === 4 / 5 && "text-blue-400"
                    )}
                  >
                    4:5{" "}
                    <span className="text-xs text-gray-400 opacity-70">
                      Portrait
                    </span>
                  </button>
                  {/* 16:9 横向 */}
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

            {/* 缩放控制 Popover */}
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
