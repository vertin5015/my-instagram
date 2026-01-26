import Image from "next/image";

export default function TaggedPage() {
  const posts = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    image: `https://picsum.photos/seed/tagged-${i}/600/600`,
  }));

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[2px] sm:gap-4 opacity-60">
      {posts.map((post) => (
        <div key={post.id} className="relative aspect-square">
          <Image src={post.image} alt="" fill className="object-cover" />
        </div>
      ))}
    </div>
  );
}
