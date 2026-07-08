import katex from "katex";
import { cn } from "@/lib/utils";

function renderKatex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode });
  } catch {
    return tex;
  }
}

/**
 * Renders a plain string containing `$inline$` and `$$display$$` LaTeX math
 * via KaTeX. Exercise `prompt`/`sampleAnswer` are plain TS strings — unlike
 * lesson MDX, they never pass through remark-math/rehype-katex, so this is
 * the equivalent for exercise content.
 */
export function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return (
            <span key={i} dangerouslySetInnerHTML={{ __html: renderKatex(part.slice(2, -2), true) }} />
          );
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          return (
            <span key={i} dangerouslySetInnerHTML={{ __html: renderKatex(part.slice(1, -1), false) }} />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/**
 * Renders `\n\n`-separated paragraphs, preserving single `\n`s as line breaks
 * within each one (e.g. a formula on its own line, a numbered task list), and
 * rendering `$inline$`/`$$display$$` LaTeX math via KaTeX within each one.
 */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split("\n\n").map((paragraph, i) => (
        <p key={i} className={cn("whitespace-pre-wrap", className)}>
          <MathText text={paragraph} />
        </p>
      ))}
    </>
  );
}
