"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react"; // 或者使用自定义的 FollowButton

// 定义类型 (与 Prisma 返回一致)
type NotificationItem = {
  id: string;
  createdAt: Date;
  type: string; // "LIKE" | "COMMENT" | "FOLLOW" | "MENTION" | "NEW_POST" | "COMMENT_LIKE"
  read: boolean;
  issuer: {
    id: string;
    username: string | null;
    image: string | null;
  };
  post: {
    id: string;
    images: string[];
  } | null;
};

// 辅助函数：按时间分组
function groupNotifications(notifications: NotificationItem[]) {
  const groups: { [key: string]: NotificationItem[] } = {
    今天: [],
    昨天: [],
    本周: [], // 简化处理，实际可以使用 date-fns 的 isThisWeek
    更早: [],
  };

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    if (isToday(date)) {
      groups["今天"].push(n);
    } else if (isYesterday(date)) {
      groups["昨天"].push(n);
    } else {
      // 简单归类，可根据需求细化
      groups["更早"].push(n);
    }
  });

  // 移除空组
  return Object.entries(groups).filter(([_, items]) => items.length > 0);
}

export function NotificationList({
  initialNotifications,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialNotifications: any[];
}) {
  const grouped = groupNotifications(initialNotifications);

  return (
    <div className="flex flex-col space-y-6">
      {grouped.map(([label, items]) => (
        <div key={label}>
          <h2 className="font-bold text-base mb-4 px-2">{label}</h2>
          <div className="flex flex-col">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
}: {
  notification: NotificationItem;
}) {
  const { type, issuer, post, createdAt } = notification;

  // 生成通知文本
  let message = "";
  switch (type) {
    case "LIKE":
      message = "赞了你的帖子";
      break;
    case "COMMENT":
      message = "评论了你的帖子";
      break;
    case "COMMENT_LIKE":
      message = "赞了你的评论";
      break;
    case "FOLLOW":
      message = "开始关注你";
      break;
    case "MENTION":
      message = "在评论中提及了你";
      break;
    case "NEW_POST":
      message = "发布了新帖子";
      break;
    default:
      message = "有新动态";
  }

  // 点击整体跳转的目标
  // 如果是 Follow，跳到对方主页；如果是 Post 相关，跳到帖子详情
  const href =
    type === "FOLLOW"
      ? `/${issuer.username}`
      : post
        ? `/post/${post.id}`
        : `/${issuer.username}`;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer group">
      <Link href={`/${issuer.username}`} className="shrink-0 mr-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={issuer.image || ""} />
          <AvatarFallback>{issuer.username?.[0]}</AvatarFallback>
        </Avatar>
      </Link>

      <Link href={href} className="flex-1 min-w-0 text-sm mr-4">
        <span className="font-semibold mr-1 hover:opacity-70">
          {issuer.username}
        </span>
        <span>{message}</span>
        <span className="text-muted-foreground ml-1 text-xs">
          {formatDistanceToNow(new Date(createdAt), {
            locale: zhCN,
            addSuffix: false,
          })
            .replace("大约", "")
            .replace(" ", "")}
        </span>
      </Link>

      {/* 右侧操作区 */}
      <div className="shrink-0">
        {type === "FOLLOW" ? (
          // 这里可以放一个真正的 ToggleFollow 按钮组件
          <Link href={`/${issuer.username}`}>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
              查看
            </button>
          </Link>
        ) : post && post.images.length > 0 ? (
          <Link href={`/post/${post.id}`}>
            <div className="relative h-11 w-11 bg-muted rounded border overflow-hidden">
              <Image
                src={post.images[0]}
                alt="Post thumbnail"
                fill
                className="object-cover"
              />
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
