"use client";

import Link from "next/link";
import { useState } from "react";

interface ParsedCaptionProps {
  text: string;
  defaultExpanded?: boolean; // 新增：是否默认展开（PostView 中通常默认展开）
}

export function ParsedCaption({
  text,
  defaultExpanded = false,
}: ParsedCaptionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!text) return null;

  const regex = /((?:#|@)[^\s#@]+)/g;
  const parts = text.split(regex);

  // 截断逻辑：如果不展开且文本过长，则截断
  const shouldTruncate = text.length > 60 && !isExpanded;
  const displayParts = shouldTruncate ? text.slice(0, 60).split(regex) : parts;

  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {displayParts.map((part, index) => {
        if (part.startsWith("#")) {
          const tag = part.slice(1);
          return (
            <Link
              key={index}
              href={`/explore/search/keyword/?q=${tag}`}
              className="text-blue-900 dark:text-blue-100 hover:underline mr-1"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@")) {
          const user = part.slice(1);
          return (
            <Link
              key={index}
              href={`/${user}`}
              className="text-blue-900 dark:text-blue-100 font-semibold hover:underline mr-1"
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}

      {/* 展开/收起 按钮 */}
      {text.length > 60 && !defaultExpanded && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground text-xs font-medium ml-1 hover:text-primary"
        >
          {isExpanded ? " 收起" : "... 更多"}
        </button>
      )}
    </div>
  );
}
