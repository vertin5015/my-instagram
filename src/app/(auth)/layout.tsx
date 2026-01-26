export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      {/* 这里可以加一些全屏的背景或者是 Instagram 风格的布局 */}
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
