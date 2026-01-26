import { Clapperboard } from "lucide-react";

export default function ReelsPage() {
  return (
    <div className="py-24 text-center text-muted-foreground">
      <div className="flex justify-center mb-4">
        <div className="p-4 border rounded-full">
          <Clapperboard size={32} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">拍摄精彩瞬间</h3>
      <p>创建你的第一个 Reels 视频</p>
    </div>
  );
}
