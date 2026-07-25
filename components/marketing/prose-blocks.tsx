/**
 * Body copy: plain paragraphs on the prose measure, generously spaced.
 * Deliberately not cards, boxes, or a grid. `spacing="wide"` is for narrative
 * pages (About) that should breathe more than the product pages.
 */
export function ProseBlocks({
  blocks,
  spacing = "normal",
}: {
  blocks: string[];
  spacing?: "normal" | "wide";
}) {
  return (
    <div className={spacing === "wide" ? "space-y-8" : "space-y-6"}>
      {blocks.map((text) => (
        <p key={text.slice(0, 40)} className="prose-body">
          {text}
        </p>
      ))}
    </div>
  );
}
