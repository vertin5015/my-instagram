import { Metadata } from "next";
import Image from "next/image";
import { getPostsByTag, getTagInfo } from "@/actions/explore";
import { TagGrid } from "@/components/explore/tag-grid";
import { Hash } from "lucide-react";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q as string;
  return {
    title: q ? `#${q} • Instagram` : "搜索标签",
  };
}

export default async function TagPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q as string;

  if (!query) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        无效的搜索参数
      </div>
    );
  }

  // 并行获取帖子列表和 Tag 统计信息
  const [postData, tagInfo] = await Promise.all([
    getPostsByTag(query),
    getTagInfo(query),
  ]);

  const { items, nextCursor } = postData;

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* 1. Tag Header (仿 Instagram 设计) */}
      <div className="w-full max-w-[935px] mx-auto px-4 pt-8 pb-8 md:flex md:items-center md:gap-10 border-b md:border-none mb-4">
        {/* 右侧文本信息 */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">#{query}</h1>

          {/* 这里未来可以加一个 "关注标签" 的按钮 */}
        </div>
      </div>

      {/* 2. Posts Grid */}
      <div className="px-0 md:px-4">
        <TagGrid tag={query} initialPosts={items} initialCursor={nextCursor} />
      </div>
    </div>
  );
}
