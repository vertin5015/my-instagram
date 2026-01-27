import { create } from "zustand";

export type CreatePostStep = "upload" | "caption" | "success";

interface CreatePostState {
  isOpen: boolean;
  step: CreatePostStep;
  /** 已选图片的预览 URL，用于展示与编辑页轮播 */
  imagePreviewUrls: string[];
  /** 原始 File 列表，用于后续上传 */
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
      state.imagePreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      return { imageFiles: files, imagePreviewUrls: urls };
    });
  },
  setCaption: (caption) => set({ caption }),
  reset: () => set(initialState),
}));
