import SideNav from "@/components/layout/side-nav";
import BottomNav from "@/components/layout/bottom-nav";
import { CreatePostModal } from "@/components/create-post/create-post-modal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="hidden md:flex h-full w-16 flex-col border-r bg-background lg:w-60 fixed left-0 top-0 z-50">
        <SideNav />
      </aside>

      <main className="flex-1 h-full overflow-y-auto md:ml-16 lg:ml-64 pb-16 md:pb-0 bg-background">
        <div className="w-full mx-auto max-w-[935px] pt-8 ">{children}</div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 md:hidden">
        <BottomNav />
      </footer>

      <CreatePostModal />
    </div>
  );
}
