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
    <ModalWrapper>
      <PostView post={post} />
    </ModalWrapper>
  );
}
