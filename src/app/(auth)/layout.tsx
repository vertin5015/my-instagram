import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景图 */}
      <Image
        src="/auth-bg.jpg"
        alt="background"
        fill
        priority
        className="object-cover"
      />

      {/* 表单内容 */}
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
