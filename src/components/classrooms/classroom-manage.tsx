"use client";

import { useState, useTransition } from "react";
import { Check, Copy, RefreshCw, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { regenerateJoinCode, removeMember } from "@/app/actions/classrooms";

export function CopyJoinCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <div className="flex items-center gap-2">
      <code className="bg-muted rounded px-2 py-1 text-sm font-semibold tracking-widest">
        {code}
      </code>
      <Button variant="ghost" size="sm" onClick={copy} className="gap-1">
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function RegenerateCodeButton({ classroomId }: { classroomId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      className="gap-1"
      onClick={() =>
        startTransition(async () => {
          try {
            await regenerateJoinCode(classroomId);
            toast.success("New join code generated");
          } catch {
            toast.error("Couldn't regenerate code");
          }
        })
      }
    >
      <RefreshCw className="size-3.5" aria-hidden /> New code
    </Button>
  );
}

export function RemoveMemberButton({
  classroomId,
  userId,
}: {
  classroomId: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label="Remove student"
      onClick={() =>
        startTransition(async () => {
          try {
            await removeMember(classroomId, userId);
            toast.success("Student removed");
          } catch {
            toast.error("Couldn't remove student");
          }
        })
      }
    >
      <UserMinus className="size-4" aria-hidden />
    </Button>
  );
}
