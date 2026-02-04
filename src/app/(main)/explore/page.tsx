import { getExplorePosts } from "@/actions/explore";
import { ExploreGrid } from "@/components/explore/explore-grid";

export default async function ExplorePage() {
  const { items, nextCursor } = await getExplorePosts();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="pt-4 px-0 md:px-4">
        <ExploreGrid initialPosts={items} initialCursor={nextCursor} />
      </div>
    </div>
  );
}
