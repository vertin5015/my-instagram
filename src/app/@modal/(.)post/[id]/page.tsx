// app/@modal/(.)post/[id]/page.tsx (或者你的拦截路由路径)
import { getPostById } from "@/actions/post";
import PostView from "@/components/post/post-view";
import { ModalWrapper } from "@/components/post/modal-wrapper";
import { notFound } from "next/navigation";

export default async function PostModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return notFound();
  }

  return (
    <ModalWrapper key={id}>
      {/* 修复关键：添加这个 div 来强制撑开高度和宽度，就像 PostPage 一样 */}
      <div className="flex w-full h-[80vh] md:h-[600px] lg:h-[658px] overflow-hidden bg-background md:rounded-lg">
        <PostView post={post} />
      </div>
    </ModalWrapper>
  );
}
