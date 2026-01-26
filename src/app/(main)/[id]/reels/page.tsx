/* eslint-disable react-hooks/purity */
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ReelsPage() {
  const posts = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    image: `https://picsum.photos/seed/tagged-${i}/600/600`,
    likes: Math.floor(Math.random() * 5000),
    comments: Math.floor(Math.random() * 300),
  }));

  return (
    <div className="grid grid-cols-3 gap-px">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-3/4 group bg-neutral-100 dark:bg-neutral-900"
        >
          <Image src={post.image} alt="" fill className="object-cover" />

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 text-white font-bold text-base md:text-lg">
            <span className="flex items-center gap-1">
              {/* 使用 className 控制宽度和高度，取代固定的 size 属性 */}
              <Heart className="fill-white w-4 h-4 md:w-6 md:h-6" />
              {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="fill-white w-4 h-4 md:w-6 md:h-6" />
              {post.comments}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
