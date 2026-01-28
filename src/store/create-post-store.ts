import { create } from "zustand";

// 新增 'crop' 步骤
export type CreatePostStep = "upload" | "crop" | "caption" | "success";

interface CreatePostState {
  isOpen: boolean;
  step: CreatePostStep;
  imagePreviewUrls: string[];
  imageFiles: File[];
  caption: string;
  open: () => void;
  close: () => void;
  setStep: (step: CreatePostStep) => void;
  setImages: (files: File[]) => void;
  setCaption: (caption: string) => void;
  reset: () => void;
}

const initialState = {
  step: "upload" as CreatePostStep,
  imagePreviewUrls: [],
  imageFiles: [],
  caption: "",
};

export const useCreatePostStore = create<CreatePostState>((set) => ({
  isOpen: false,
  ...initialState,
  open: () => set({ isOpen: true, ...initialState }),
  close: () => set({ isOpen: false, ...initialState }),
  setStep: (step) => set({ step }),
  setImages: (files) => {
    const urls = files.map((f) => URL.createObjectURL(f));
    set((state) => {
      // 清理旧 URL
      state.imagePreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      // 设置新图片并自动跳转到 'crop' 预览步骤
      return { imageFiles: files, imagePreviewUrls: urls, step: "crop" };
    });
  },
  setCaption: (caption) => set({ caption }),
  reset: () => set(initialState),
}));
