"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { searchUsers, SearchResultUser } from "@/actions/user";

const HISTORY_KEY = "ig_search_history";
const MAX_HISTORY = 10;

export function SearchView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultUser[]>([]);
  const [history, setHistory] = useState<SearchResultUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 初始化：从 LocalStorage 加载历史记录
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse search history", e);
        }
      }
    }
  }, []);

  // 防抖搜索逻辑
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        const data = await searchUsers(query);
        setResults(data);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300); // 300ms 防抖

    return () => clearTimeout(timer);
  }, [query]);

  // 添加到历史记录
  const addToHistory = (user: SearchResultUser) => {
    const newHistory = [
      user,
      ...history.filter((h) => h.id !== user.id), // 避免重复，移到最前
    ].slice(0, MAX_HISTORY);

    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 删除单条历史
  const removeFromHistory = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation(); // 防止触发跳转
    const newHistory = history.filter((u) => u.id !== userId);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  // 清空所有历史
  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  // 处理点击用户
  const handleUserClick = (user: SearchResultUser) => {
    addToHistory(user);
    // 跳转逻辑通常由 Link 处理，但如果是为了记录历史后跳转，也可以用 router.push
    // 这里因为 Link 已经包裹，不需要额外 push，onClick 仅处理副作用
  };

  const showHistory = !query && history.length > 0;
  const showResults = !!query;

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen bg-background">
      {/* 搜索框区域 */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <h1 className="text-2xl font-bold mb-4">搜索</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-muted/50 rounded-lg pl-10 pr-10 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
            placeholder="搜索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="pt-2">
        {/* 1. 历史记录模块 */}
        {showHistory && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between px-4 py-2 mt-2">
              <span className="font-bold text-sm">最近搜索</span>
              <button
                onClick={clearAllHistory}
                className="text-sm text-blue-500 font-semibold hover:text-blue-700"
              >
                全部清除
              </button>
            </div>

            {history.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                isHistoryItem
                onRemove={(e) => removeFromHistory(e, user.id)}
                onClick={() => handleUserClick(user)}
              />
            ))}
          </div>
        )}

        {/* 2. 搜索结果模块 */}
        {showResults && (
          <div>
            {results.length === 0 && !isLoading ? (
              <div className="text-center text-muted-foreground py-10 text-sm">
                未找到相关用户
              </div>
            ) : (
              results.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onClick={() => handleUserClick(user)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 子组件：用户列表项
function UserListItem({
  user,
  isHistoryItem = false,
  onRemove,
  onClick,
}: {
  user: SearchResultUser;
  isHistoryItem?: boolean;
  onRemove?: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <Link
      href={`/${user.username}`}
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Avatar className="h-11 w-11 shrink-0 border border-border">
          <AvatarImage src={user.image || ""} />
          <AvatarFallback>{user.username?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="font-semibold text-sm truncate">
            {user.username}
          </span>
          <span className="text-muted-foreground text-sm truncate flex items-center gap-1">
            {user.name || user.username}
            {/* 仅在搜索结果中显示粉丝数提示，历史记录一般不显示这个 */}
            {!isHistoryItem && (
              <span className="text-xs text-muted-foreground">
                • {user._count.followedBy} 粉丝
              </span>
            )}
          </span>
        </div>
      </div>

      {isHistoryItem && onRemove && (
        <button
          onClick={onRemove}
          className="p-2 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Link>
  );
}
