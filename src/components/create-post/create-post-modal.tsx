"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Smile } from "lucide-react";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import Image from "next/image";

import { useCreatePostStore } from "@/store/create-post-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { CreatePostUpload } from "./create-post-upload";
import { ImageCarousel } from "./image-carousel";

const MAX_CHAR = 2200;

export function CreatePostModal() {
  const {
    isOpen,
    step,
    imagePreviewUrls,
    caption,
    close,
    setStep,
    setImages,
    setCaption,
  } = useCreatePostStore();
  const { user } = useAuthStore();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

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

  const handleBack = () => {
    if (step === "crop") {
      // 返回上传页，需要确认是否丢弃（这里简单处理为直接清空）
      const confirm = window.confirm(
        "要放弃帖子吗？如果离开，所做的修改将会丢失。"
      );
      if (confirm) {
        setImages([]);
        setStep("upload");
      }
    } else if (step === "caption") {
      setStep("crop");
    }
  };

  const handleShare = async () => {
    // 这里调用后端 API
    console.log("Sharing post:", { images: imagePreviewUrls, caption });
    setStep("success");
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (caption.length + emojiData.emoji.length <= MAX_CHAR) {
      setCaption(caption + emojiData.emoji);
    }
  };

  if (!isOpen) return null;

  // 动态计算 Modal 宽度：上传和预览页较窄，填写文案页变宽
  const modalWidthClass =
    step === "caption"
      ? "max-w-[850px]"
      : "max-w-[500px] aspect-square min-h-[300px]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={close}
    >
      {/* 关闭按钮 (右上角) */}
      <button
        onClick={close}
        className="absolute top-4 right-4 text-white/80 hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-background w-full overflow-hidden rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out",
          step === "upload" || step === "crop"
            ? "h-[50vh] md:h-[500px]"
            : "h-[50vh] md:h-[500px]", // 保持高度一致避免抖动
          modalWidthClass
        )}
      >
        {/* --- Header --- */}
        <header className="flex h-[44px] shrink-0 items-center justify-between border-b px-4">
          <div className="w-10">
            {step !== "upload" && step !== "success" && (
              <button onClick={handleBack} className="p-1">
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
                className="text-[#0095f6] hover:text-[#00376b] font-semibold hover:bg-transparent p-0"
                onClick={() => setStep("caption")}
              >
                下一步
              </Button>
            )}
            {step === "caption" && (
              <Button
                variant="ghost"
                className="text-[#0095f6] hover:text-[#00376b] font-semibold hover:bg-transparent p-0"
                onClick={handleShare}
              >
                分享
              </Button>
            )}
          </div>
        </header>

        {/* --- Body --- */}
        <div className="flex flex-1 overflow-hidden">
          {/* 成功状态 */}
          {step === "success" ? (
            <div className="flex w-full flex-col items-center justify-center gap-4 animate-in zoom-in-95">
              <div className="rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                <div className="rounded-full bg-background p-4">
                  <Image
                    src="/check.png"
                    alt="Success"
                    width={60}
                    height={60}
                    className="hidden"
                  />{" "}
                  {/* 可以换成 Icon */}
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
              <Button
                variant="ghost"
                className="text-[#0095f6]"
                onClick={close}
              >
                完成
              </Button>
            </div>
          ) : (
            <>
              {/* 左侧：图片区域 (在 caption 步骤时只占一部分，其他时候占满) */}
              <div
                className={cn(
                  "relative transition-all duration-300 ease-in-out bg-black",
                  step === "caption"
                    ? "hidden md:block w-[60%] border-r border-border"
                    : "w-full",
                  step === "upload" && "bg-background" // 上传页不需要黑色背景
                )}
              >
                {step === "upload" ? (
                  <CreatePostUpload onImagesSelected={setImages} />
                ) : (
                  <ImageCarousel urls={imagePreviewUrls} />
                )}
              </div>

              {/* 右侧：文案填写 (仅在 caption 步骤显示) */}
              {step === "caption" && (
                <div className="flex flex-col w-full md:w-[40%] bg-background">
                  {/* 用户信息 */}
                  <div className="flex items-center gap-3 p-4">
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

                  {/* 输入框 */}
                  <textarea
                    value={caption}
                    onChange={(e) =>
                      setCaption(e.target.value.slice(0, MAX_CHAR))
                    }
                    placeholder="撰写说明..."
                    className="flex-1 resize-none border-none p-4 text-sm outline-none leading-relaxed"
                    autoFocus
                  />

                  {/* 工具栏：Emoji & 字数 */}
                  <div className="relative flex items-center justify-between px-4 py-3 border-t md:border-t-0">
                    <div className="relative" ref={emojiRef}>
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Smile className="h-6 w-6" />
                      </button>

                      {/* Emoji Picker Popover */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-10 left-0 z-50 shadow-xl">
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            width={300}
                            height={350}
                            theme={Theme.AUTO} // 自适应暗黑模式
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

                  {/* 可以在这里加 "添加地点" 等选项，模仿 Ins 布局 */}
                  <div className="border-t border-border">{/* 预留区域 */}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
