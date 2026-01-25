import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SideNav from "@/components/layout/side-nav";
import BottomNav from "@/components/layout/bottom-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instagram Clone",
  description: "A fullstack clone built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        {/* 整体布局容器 
          在桌面端是 flex-row (左右结构)
          在移动端是 flex-col (上下结构，但导航是fixed的，所以主要是为了占位)
        */}
        <div className="flex h-full flex-col md:flex-row">
          {/* 桌面端侧边栏 - 在中等屏幕以下隐藏 */}
          <aside className="hidden md:flex h-full w-16 flex-col border-r bg-background lg:w-64 fixed left-0 top-0 z-50">
            <SideNav />
          </aside>

          {/* 主内容区域 
            移动端：铺满
            桌面端：留出左侧边栏的宽度 (ml-16 或 ml-64)
          */}
          <main className="flex-1 h-full overflow-y-auto md:ml-16 lg:ml-64 pb-16 md:pb-0 bg-background">
            {/* 这里预留一个最大宽度，模仿Ins网页版的中心聚焦感 */}
            <div className="w-full mx-auto max-w-[935px] pt-8 px-4">
              {children}
            </div>
          </main>

          {/* 移动端底部导航 - 在中等屏幕以上隐藏 */}
          <footer className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 md:hidden">
            <BottomNav />
          </footer>
        </div>
      </body>
    </html>
  );
}
