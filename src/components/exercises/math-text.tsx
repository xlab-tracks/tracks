import katex from "katex";

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
