import * as React from "react";

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "article";
};

/**
 * Passthrough wrapper. Earlier versions of this used motion's `whileInView`
 * to fade sections on scroll, but the entry animation added more risk than
 * value (hydration mismatches, hidden content under headless capture, no
 * meaningful gain on a single-page editorial layout). Kept as a component so
 * sections can opt back in later without churn.
 */
export function Reveal({
  children,
  delay: _delay,
  className,
  as = "div",
}: RevealProps) {
  void _delay;
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}
