"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, Smile, X } from "lucide-react";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import { useCreatePostStore } from "@/store/create-post-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createPost } from "@/actions/create-post";

import { CreatePostUpload } from "./create-post-upload";
import { ImageCarousel, CarouselRef, ImageCropData } from "./image-carousel";

const MAX_CHAR = 2200;

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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // 1. 新增：用于获取 ImageCarousel 内部数据的 ref
  const carouselRef = useRef<CarouselRef>(null);

  // 2. 新增：暂存从 ImageCarousel 获取的裁剪数据
  const [finalCropData, setFinalCropData] = useState<ImageCropData[]>([]);

  // 清理内存
  useEffect(() => {
    return () => imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [imagePreviewUrls]);

  // 点击外部关闭 Emoji 选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSafeClose = useCallback(() => {
    if (step === "crop" || step === "caption") {
      const confirm = window.confirm(
        "要放弃帖子吗？如果离开，所做的修改将会丢失。"
      );
      if (confirm) {
        close();
        setImages([]);
        setFinalCropData([]); // 重置数据
      }
    } else {
      close();
    }
  }, [step, close, setImages]);

  const handleBack = () => {
    if (step === "crop") {
      const confirm = window.confirm(
        "要放弃帖子吗？如果离开，所做的修改将会丢失。"
      );
      if (confirm) {
        setImages([]);
        setStep("upload");
        setFinalCropData([]);
      }
    } else if (step === "caption") {
      setStep("crop");
    }
  };

  // 监听 ESC 键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleSafeClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleSafeClose]);

  // --- 处理“下一步”点击 ---
  const handleNextStep = () => {
    if (step === "crop" && carouselRef.current) {
      // 1. 从子组件获取当前的裁剪数据
      const crops = carouselRef.current.getCropData();
      // 2. 存入 State
      setFinalCropData(crops);
      // 3. 进入下一步 (因为不需要前端处理图片，所以瞬间完成)
      setStep("caption");
    } else {
      setStep("caption");
    }
  };

  const handleShare = async () => {
    if (!imageFiles.length || isSharing) return;
    try {
      setIsSharing(true);
      const formData = new FormData();
      formData.append("caption", caption || "");

      // 添加原图
      for (const file of imageFiles) {
        formData.append("images", file);
      }

      // 添加裁剪数据 (序列化为 JSON 字符串)
      // 注意：这里的数据顺序必须与 images 顺序一致，通常 imageFiles 索引顺序是一致的
      if (finalCropData.length > 0) {
        formData.append("cropData", JSON.stringify(finalCropData));
      }

      await createPost(formData);

      setStep("success");
      setImages([]);
      setCaption("");
      setFinalCropData([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "发布失败，请稍后重试";
      window.alert(msg);
    } finally {
      setIsSharing(false);
      close();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (caption.length + emojiData.emoji.length <= MAX_CHAR) {
      setCaption(caption + emojiData.emoji);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
      onClick={handleSafeClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSafeClose();
        }}
        className="absolute top-4 right-4 z-60 text-white/80 hover:text-white transition-colors"
      >
        <X className="h-8 w-8 drop-shadow-md" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-background w-full overflow-hidden rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out",
          "h-[60vh] md:h-[70vh] max-h-200 min-h-100",
          step === "upload" && "max-w-125 md:aspect-square",
          step === "crop" && "max-w-125 md:w-auto md:min-w-125",
          step === "caption" && "max-w-225 md:w-225",
          step === "success" && "max-w-100 h-auto min-h-75"
        )}
      >
        {/* --- Header --- */}
        <header className="flex h-11 shrink-0 items-center justify-between border-b px-4 bg-background z-10 relative">
          <div className="w-10">
            {step !== "upload" && step !== "success" && (
              <button
                onClick={handleBack}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}
          </div>

          <h1 className="text-base font-semibold truncate">
            {step === "upload" && "创建新帖子"}
            {step === "crop" && "裁剪"}
            {step === "caption" && "创建新帖子"}
            {step === "success" && "帖子已发布"}
          </h1>

          <div className="w-10 flex justify-end">
            {step === "crop" && (
              <Button
                variant="ghost"
                className="text-[#0095f6] hover:text-[#00376b] font-semibold hover:bg-transparent p-0 text-sm"
                onClick={handleNextStep} // 改为调用 handleNextStep
              >
                下一步
              </Button>
            )}
            {step === "caption" && (
              <Button
                variant="ghost"
                className="text-[#0095f6] hover:text-[#00376b] font-semibold hover:bg-transparent p-0 text-sm"
                onClick={handleShare}
                disabled={isSharing || imageFiles.length === 0}
              >
                {isSharing ? "发布中..." : "分享"}
              </Button>
            )}
          </div>
        </header>

        {/* --- Body --- */}
        <div className="flex flex-1 overflow-hidden relative">
          {step === "success" ? (
            <div className="flex w-full flex-col items-center justify-center gap-4 animate-in zoom-in-95 p-8">
              <div className="rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                <div className="rounded-full bg-background p-4">
                  <svg
                    className="h-12 w-12 text-transparent bg-clip-text bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                      stroke="#d946ef"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-medium">帖子已发布</h2>
              <Button onClick={close} variant="ghost" className="text-blue-500">
                完成
              </Button>
            </div>
          ) : (
            <div className="flex w-full h-full">
              {/* 图片区域 */}
              <div
                className={cn(
                  "relative h-full transition-all duration-300 ease-in-out bg-black flex items-center justify-center",
                  step === "caption"
                    ? "hidden md:flex md:w-[60%] border-r border-border"
                    : "w-full",
                  step === "upload" && "bg-background"
                )}
              >
                {step === "upload" ? (
                  <CreatePostUpload onImagesSelected={setImages} />
                ) : (
                  <ImageCarousel
                    ref={carouselRef} // 绑定 Ref
                    urls={imagePreviewUrls}
                    step={step}
                  />
                )}
              </div>

              {/* 文案区域 */}
              {step === "caption" && (
                <div className="flex flex-col w-full md:w-[40%] bg-background h-full">
                  <div className="flex items-center gap-3 p-4 shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image || undefined} />
                      <AvatarFallback>
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">
                      {user?.username}
                    </span>
                  </div>

                  <textarea
                    value={caption}
                    onChange={(e) =>
                      setCaption(e.target.value.slice(0, MAX_CHAR))
                    }
                    placeholder="撰写说明..."
                    className="flex-1 resize-none border-none p-4 text-sm outline-none leading-relaxed bg-transparent"
                    autoFocus
                  />

                  <div className="relative flex items-center justify-between px-4 py-3 border-t md:border-t-0 shrink-0">
                    <div className="relative" ref={emojiRef}>
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        <Smile className="h-6 w-6" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-10 left-0 z-50 shadow-xl">
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            width={300}
                            height={350}
                            theme={Theme.AUTO}
                            searchDisabled
                            previewConfig={{ showPreview: false }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {caption.length}/{MAX_CHAR}
                    </span>
                  </div>
                  <div className="border-t border-border p-4 text-sm text-muted-foreground">
                    高级设置 (演示)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
