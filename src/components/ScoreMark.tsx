import { scoreTier, tierColor } from "@/lib/ui";

export function ScoreMark({ score, size = "md" }: { score: number | null; size?: "sm" | "md" | "lg" }) {
  const tier = scoreTier(score);
  const color = tierColor[tier];
  const dims = size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";

  return (
    <div
      className={`${dims} shrink-0 flex items-center justify-center rounded-full font-mono tabular border`}
      style={{ borderColor: color, color }}
    >
      {score ?? 0}
    </div>
  );
}
