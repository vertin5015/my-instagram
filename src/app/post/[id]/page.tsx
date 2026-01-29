import { getPostById } from "@/actions/post";
import PostView from "@/components/post/post-view";
import { notFound } from "next/navigation";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[1200px] border rounded-lg overflow-hidden shadow-lg h-[80vh] md:h-[600px] lg:h-[700px]">
        {/* 复用同一个视图组件 */}
        <PostView post={post} />
      </div>
    </div>
  );
}
