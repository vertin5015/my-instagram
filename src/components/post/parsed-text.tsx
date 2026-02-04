"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ParsedTextProps {
  text: string;
  defaultExpanded?: boolean; // 是否默认展开
  threshold?: number; // 截断阈值，默认 100 字符
  className?: string; // 允许外部传入额外的样式
}

export function ParsedText({
  text,
  defaultExpanded = false,
  threshold = 100,
  className,
}: ParsedTextProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!text) return null;

  // 1. 截断逻辑
  // 如果文本长度超过阈值且未展开，则进行截断
  const shouldTruncate = text.length > threshold && !isExpanded;
  const displayText = shouldTruncate ? text.slice(0, threshold) + "..." : text;

  // 2. 正则解析逻辑 (核心改进)
  // 组1 (@...): 匹配 @ 开头，后跟字母、数字、下划线或点号
  // 组2 (#...): 匹配 # 开头，后跟字母、数字、下划线或中文
  // 使用捕获组 () 可以在 split 时保留分隔符
  const regex = /(@[a-zA-Z0-9_.]+|#[a-zA-Z0-9_\u4e00-\u9fa5]+)/g;

  const parts = displayText.split(regex);

  return (
    <div
      className={cn(
        "text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
        className
      )}
    >
      {parts.map((part, index) => {
        // --- 处理 Hashtag ---
        if (part.startsWith("#")) {
          // 再次校验，防止 split 产生的空字符串或纯符号干扰
          if (part.length === 1) return <span key={index}>{part}</span>;

          const tag = part.slice(1);
          return (
            <Link
              key={index}
              href={`/explore/search/keyword/?q=${tag}`}
              className="text-blue-900 dark:text-blue-100 hover:underline mr-0.5"
            >
              {part}
            </Link>
          );
        }

        // --- 处理 Mention (@用户) ---
        if (part.startsWith("@")) {
          if (part.length === 1) return <span key={index}>{part}</span>;

          // 特殊处理：如果匹配到了 "@user."（句号结尾），通常句号是标点而不是用户名的一部分
          // 我们需要把句号剥离出来
          let cleanPart = part;
          let suffix = "";

          if (cleanPart.endsWith(".")) {
            cleanPart = cleanPart.slice(0, -1);
            suffix = ".";
          }

          const username = cleanPart.slice(1);

          return (
            <span key={index}>
              <Link
                href={`/${username}`}
                className="text-blue-900 dark:text-blue-100 font-semibold hover:underline mr-0.5"
              >
                {cleanPart}
              </Link>
              {suffix}
            </span>
          );
        }

        // --- 普通文本 ---
        return <span key={index}>{part}</span>;
      })}

      {/* --- 展开/收起 按钮 --- */}
      {text.length > threshold && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // 防止触发父级点击事件（如果有）
            setIsExpanded(!isExpanded);
          }}
          className="text-muted-foreground text-xs font-medium ml-1 hover:text-foreground inline-block cursor-pointer"
        >
          {isExpanded ? " 收起" : " 更多"}
        </button>
      )}
    </div>
  );
}
