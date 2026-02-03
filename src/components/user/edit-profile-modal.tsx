"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateProfileInfo } from "@/actions/profile";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditProfileModalProps {
  user: {
    name: string | null;
    bio: string | null;
  };
}

export function EditProfileModal({ user }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 字数限制
  const BIO_LIMIT = 100;

  // 处理点击遮罩层关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current === e.target) {
      setIsOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);

    startTransition(async () => {
      const res = await updateProfileInfo(formData);
      if (res.success) {
        toast.success("个人资料已更新");
        setIsOpen(false);
        router.refresh(); // 强制刷新页面以显示最新数据
      } else {
        toast.error(res.error || "更新失败");
      }
    });
  };

  return (
    <>
      {/* 触发按钮：编辑主页 */}
      <button
        onClick={() => setIsOpen(true)}
        className="h-8 px-4 text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
      >
        编辑主页
      </button>

      {/* 模态框 */}
      {isOpen && (
        <div
          ref={modalRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-base">编辑个人资料</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-foreground p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  姓名
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full px-3 py-2 bg-transparent border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  placeholder="你的名字"
                />
              </div>

              {/* Bio Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="bio" className="text-sm font-medium">
                    简介
                  </label>
                  <span
                    className={`text-xs ${
                      bio.length > BIO_LIMIT
                        ? "text-red-500"
                        : "text-neutral-500"
                    }`}
                  >
                    {bio.length} / {BIO_LIMIT}
                  </span>
                </div>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={BIO_LIMIT}
                  rows={3}
                  className="w-full px-3 py-2 bg-transparent border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm resize-none scrollbar-hide"
                  placeholder="介绍一下你自己..."
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-foreground transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
