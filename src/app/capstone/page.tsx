import type { Metadata } from "next";
import { getModulesForTrack, tracks } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import { getCapstone } from "@/lib/capstone";
import {
  saveCapstoneEntry,
  setCapstoneTopic,
  submitCapstoneEntry,
} from "@/app/actions/capstone";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CapstoneTopicForm } from "@/components/capstone/capstone-topic-form";
import { WritingEditor } from "@/components/exercises/writing-editor";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Capstone" };

export default async function CapstonePage() {
  const user = await requireUser();
  const capstoneTracks = tracks.filter((t) => t.hasCapstone);

  const projects = new Map<string, Awaited<ReturnType<typeof getCapstone>>>();
  await Promise.all(
    capstoneTracks.map(async (t) => {
      projects.set(t.id, await getCapstone(user.id, t.id));
    }),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Capstone" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Capstone</h1>
      <p className="text-muted-foreground mt-2">
        Pick a topic early and build toward a final deliverable. Lorem ipsum dolor
        sit amet, consectetur adipiscing elit.
      </p>

      <div className="mt-8 space-y-8">
        {capstoneTracks.map((track) => {
          const project = projects.get(track.id) ?? null;
          const entriesByModule = new Map(
            (project?.entries ?? []).map((e) => [e.moduleId, e]),
          );
          const checkpoints =
            track.capstoneMode === "progressive"
              ? getModulesForTrack(track.id).filter((m) => m.capstoneCheckpoint)
              : [];

          return (
            <section
              key={track.id}
              className="border-border shadow-soft rounded-xl border p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{track.title}</h2>
                <Badge variant="outline">
                  {track.capstoneMode === "progressive"
                    ? "Progressive"
                    : "Final module"}
                </Badge>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium">Topic</p>
                <p className="text-muted-foreground mb-2 text-xs">
                  Choose this early — your work builds toward it.
                </p>
                <CapstoneTopicForm
                  initialTopic={project?.topic ?? ""}
                  action={setCapstoneTopic.bind(null, track.id)}
                />
              </div>

              {project?.topic ? (
                track.capstoneMode === "progressive" ? (
                  <div className="mt-6 space-y-6">
                    {checkpoints.map((m) => (
                      <div key={m.id}>
                        <h3 className="font-medium">{m.capstoneCheckpoint!.title}</h3>
                        <p className="text-muted-foreground text-sm">
                          {m.capstoneCheckpoint!.prompt}
                        </p>
                        <div className="mt-2">
                          <WritingEditor
                            sections={[
                              {
                                id: "text",
                                label: "Your work",
                                placeholder: "Write your checkpoint contribution…",
                              },
                            ]}
                            initialValues={{
                              text: entriesByModule.get(m.id)?.contentText ?? "",
                            }}
                            onSaveDraft={saveCapstoneEntry.bind(null, track.id, m.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6">
                    <h3 className="font-medium">Final deliverable</h3>
                    <p className="text-muted-foreground text-sm">
                      Your capstone paper or application for the final module.
                    </p>
                    <div className="mt-2">
                      <WritingEditor
                        sections={[
                          {
                            id: "text",
                            label: "Final deliverable",
                            placeholder: "Write your capstone…",
                          },
                        ]}
                        initialValues={{
                          text: entriesByModule.get("final")?.contentText ?? "",
                        }}
                        submitted={project.status === "submitted"}
                        onSaveDraft={saveCapstoneEntry.bind(null, track.id, "final")}
                        onSubmit={submitCapstoneEntry.bind(null, track.id, "final")}
                        submitLabel="Submit capstone"
                      />
                    </div>
                  </div>
                )
              ) : (
                <p className="text-muted-foreground mt-4 text-sm">
                  Set your topic above to start working on your capstone.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
