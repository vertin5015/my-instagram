import { getNotifications } from "@/actions/notification";
import { NotificationList } from "@/components/notification/notification-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications • Instagram",
};

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-4 md:px-0">
      <h1 className="text-2xl font-bold mb-6 px-4 md:px-0">通知</h1>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="text-lg">暂无通知</div>
          <p className="text-sm">当有人点赞或评论你的帖子时，会在这里显示。</p>
        </div>
      ) : (
        <NotificationList initialNotifications={notifications} />
      )}
    </div>
  );
}
