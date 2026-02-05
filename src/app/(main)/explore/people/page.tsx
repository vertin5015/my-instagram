import { getAllSuggestedUsers } from "@/actions/user";
import { SuggestedUserCard } from "@/components/user/suggested-user-card";

export default async function DiscoverPeoplePage() {
  const { items } = await getAllSuggestedUsers();

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-lg font-bold mb-4">为你推荐</h1>

      {/* 描述文案 */}
      {/* <p className="text-sm text-muted-foreground mb-6">根据你的兴趣和关注对象推荐</p> */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((user) => (
          <SuggestedUserCard key={user.id} user={user} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">
          暂无更多推荐用户
        </div>
      )}
    </div>
  );
}
