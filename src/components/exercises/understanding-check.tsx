"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EXERCISE_TYPE_LABELS } from "@/lib/content/types";
import { Paragraphs } from "./math-text";

export function UnderstandingCheckCard({
  prompt,
  sampleAnswer,
}: {
  prompt: string;
  sampleAnswer: string;
}) {
  const [text, setText] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <aside className="not-prose border-border bg-card shadow-soft my-6 rounded-xl border p-5">
      <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {EXERCISE_TYPE_LABELS["understanding-check"]}
      </p>
      <div className="space-y-2">
        <Paragraphs text={prompt} className="font-medium" />
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your answer, then compare with the sample…"
        rows={4}
        className="mt-3 resize-y"
      />

      <div className="mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? "Hide" : "Show"} sample answer
        </Button>
      </div>

      {revealed && (
        <div className="bg-muted mt-3 space-y-2 rounded-lg p-3 text-sm">
          <Paragraphs text={sampleAnswer} className="text-muted-foreground" />
        </div>
      )}
    </aside>
  );
}
