import { cn } from "@/lib/utils";

/*
 * Brand lockup: emblem (public/Logo.png) on the left, "Dirac Robotics" wordmark
 * on the right.
 *
 * Original emblem and Syne wordmark are preserved. Blend modes adapt the
 * supplied image to the light page or dark hero without redrawing it.
 */

const SIZES = {
  sm: { img: "h-8 w-8", text: "text-[1.1rem]" },
  md: { img: "h-10 w-10", text: "text-[1.1rem] sm:text-[1.35rem]" },
} as const;

export function Logo({
  size = "sm",
  onDark = false,
  className,
}: {
  size?: keyof typeof SIZES;
  onDark?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap font-serif leading-none tracking-[-0.01em]",
        onDark ? "text-white" : "text-foreground",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Logo.png"
        alt=""
        className={cn("shrink-0 object-contain", onDark ? "mix-blend-screen" : "mix-blend-multiply invert", s.img)}
      />
      <span className={s.text}>Dirac Robotics</span>
    </span>
  );
}
