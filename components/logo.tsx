import { cn } from "@/lib/utils";

/*
 * Brand lockup: emblem (public/Logo.png) on the left, "Dirac Robotics" wordmark
 * on the right.
 *
 * NOTE: Logo.png ships with a grey gradient background (not transparent), so we
 * composite it with `mix-blend-screen`, which drops the dark background against
 * the near-black header and keeps the white emblem. For a perfectly crisp mark,
 * replace public/Logo.png with a transparent PNG or an SVG and the blend mode
 * can be removed. The filename is capital-L `Logo.png` (case-sensitive on
 * Vercel), referenced exactly below.
 */

const SIZES = {
  sm: { img: "h-7 w-7", text: "text-[1.05rem]" },
  md: { img: "h-9 w-9", text: "text-[1.35rem]" },
} as const;

export function Logo({
  size = "sm",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-serif leading-none tracking-[-0.01em] text-foreground",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Logo.png"
        alt=""
        className={cn("shrink-0 object-contain mix-blend-screen", s.img)}
      />
      <span className={s.text}>Dirac Robotics</span>
    </span>
  );
}
