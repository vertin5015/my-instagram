"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useCreatePostStore } from "@/store/create-post-store";
import { useAuthStore } from "@/store/auth-store";
import { CreatePostUpload } from "./create-post-upload";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function CreatePostModal() {
  const {
    isOpen,
    step,
    imagePreviewUrls,
    imageFiles,
    caption,
    close,
    setStep,
    setImages,
    setCaption,
  } = useCreatePostStore();
  const { user } = useAuthStore();

  // 清理预览 URL，避免内存泄漏
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const handleBack = useCallback(() => {
    if (step === "upload") {
      close();
    } else if (step === "caption") {
      setStep("upload");
    }
  }, [step, close, setStep]);

  const handleUploadNext = useCallback(() => {
    if (imageFiles.length > 0) setStep("caption");
  }, [imageFiles.length, setStep]);

  const handleShare = useCallback(() => {
    // 前端先只做“发帖成功”展示，后续再接接口
    setStep("success");
  }, [setStep]);

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal
      aria-label="新建帖子"
    >
      <div
        className={cn(
          "bg-background max-h-[90vh] w-full max-w-[900px] overflow-hidden rounded-xl shadow-2xl",
          "flex flex-col",
          step === "success" && "max-w-[400px]"
        )}
      >
        {/* 顶部栏：返回 | 标题 | 主操作 */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex size-9 items-center justify-center rounded-full hover:bg-accent -ml-1"
            aria-label="返回"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="text-base font-semibold">
            {step === "upload" && "新建帖子"}
            {step === "caption" && "编辑"}
            {step === "success" && "发帖成功"}
          </span>
          <div className="w-9">
            {step === "upload" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-semibold"
                disabled={imageFiles.length === 0}
                onClick={handleUploadNext}
              >
                下一步
              </Button>
            )}
            {step === "caption" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-semibold"
                onClick={handleShare}
              >
                分享
              </Button>
            )}
          </div>
        </header>

        {/* 内容区：从左到右的步骤切换 */}
        <div className="relative flex-1 overflow-hidden min-h-[420px]">
          {step === "success" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 px-6">
              <div className="rounded-full bg-primary/10 p-4">
                <svg
                  className="h-10 w-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold">发帖成功</p>
              <Button onClick={handleClose}>完成</Button>
            </div>
          ) : (
            <div className="overflow-hidden h-full">
              <div
                className="flex w-[200%] h-full transition-[transform] duration-300 ease-out"
                style={{
                  transform:
                    step === "upload" ? "translateX(0)" : "translateX(-50%)",
                }}
              >
                {/* 第一步：上传 */}
                <div className="w-1/2 shrink-0 p-4 flex flex-col">
                  <CreatePostUpload
                    onImagesSelected={(files) => setImages(files)}
                    maxCount={10}
                  />
                </div>
                {/* 第二步：编辑文案 */}
                <div className="w-1/2 shrink-0 flex min-h-[400px]">
                  <CaptionImageCarousel urls={imagePreviewUrls} />
                  <div className="flex w-[340px] shrink-0 flex-col border-l">
                    <div className="flex items-center gap-3 border-b px-4 py-3">
                      <Avatar size="sm" className="size-8">
                        <AvatarImage src={user?.image ?? undefined} alt="" />
                        <AvatarFallback>
                          {(user?.username ?? user?.name ?? "?").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">
                        {user?.username ?? user?.name ?? "用户"}
                      </span>
                    </div>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="撰写文案..."
                      className="min-h-[200px] flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
                      rows={6}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 编辑页左侧图片轮播：左右箭头切换 */
function CaptionImageCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex((i) => (i <= 0 ? urls.length - 1 : i - 1));
  const next = () => setIndex((i) => (i >= urls.length - 1 ? 0 : i + 1));

  if (urls.length === 0) return null;

  return (
    <div className="relative flex flex-1 items-center justify-center bg-muted/30 min-h-[360px]">
      <Image
        src={urls[index]}
        alt=""
        className="max-h-[360px] w-auto max-w-full object-contain"
        height={50}
        width={50}
      />
      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="上一张"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 rotate-180"
            aria-label="下一张"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {urls.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-4 bg-primary" : "w-1.5 bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
