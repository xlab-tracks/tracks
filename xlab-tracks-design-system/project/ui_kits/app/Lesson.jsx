/* Lesson reader: lesson list rail + content. Exposes AppLesson to window. */
const NS_LESSON = window.XLabTracksDesignSystem_8f3d24;

const LESSONS = [
  { n: 1, t: 'What we mean by "AI safety"', done: true },
  { n: 2, t: 'The alignment problem', done: true },
  { n: 3, t: 'Specification & reward hacking', done: true },
  { n: 4, t: 'Goal misgeneralisation', done: true },
  { n: 5, t: 'Threat models, mapped', done: true },
  { n: 6, t: 'Oversight & scalability', done: false, current: true },
  { n: 7, t: 'Interpretability, briefly', done: false },
  { n: 8, t: 'Where the field is going', done: false },
];

function AppLesson({ onBack, onComplete }) {
  const { Button, Badge, Tabs, ProgressBar } = NS_LESSON;
  const [done, setDone] = React.useState(false);
  const completed = LESSONS.filter(l => l.done).length + (done ? 1 : 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: '100%' }}>
      {/* Lesson rail */}
      <aside style={{ borderRight: '0.5px solid var(--border-subtle)', padding: '24px 18px', background: 'var(--bg-base)' }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          <i className="ti ti-arrow-left" /> All tracks
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <i className="ti ti-route" style={{ fontSize: 22, color: 'var(--accent)' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--text-primary)', margin: 0 }}>Foundations of AI safety</p>
        </div>
        <div style={{ margin: '12px 0 18px' }}><ProgressBar value={completed} max={LESSONS.length} size="sm" label="Track progress" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LESSONS.map((l) => {
            const isDone = l.done || (l.current && done);
            const cur = l.current;
            return (
              <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--radius-sm)', background: cur ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'transparent', cursor: 'pointer' }}>
                <i className={`ti ti-${isDone ? 'circle-check-filled' : (cur ? 'player-play-filled' : 'circle')}`}
                   style={{ fontSize: 17, color: isDone ? 'var(--success)' : (cur ? 'var(--accent)' : 'var(--text-muted)') }} />
                <span style={{ fontSize: 13.5, color: cur ? 'var(--text-primary)' : (isDone ? 'var(--text-secondary)' : 'var(--text-muted)'), fontWeight: cur ? 600 : 400 }}>
                  {l.n}. {l.t}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Content */}
      <article style={{ overflow: 'auto' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '34px 36px 56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Badge variant="outline">Lesson 6 of 8</Badge>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="ti ti-clock" /> 20 min read</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 36, lineHeight: 1.12, color: 'var(--text-primary)', margin: '0 0 20px' }}>
            Oversight &amp; scalability
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 18px' }}>
            As models get more capable, the hardest part of training them isn't compute — it's <em style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>knowing whether they did the right thing</em>. When a system can write a proof you can't check, or a plan you can't fully trace, human oversight stops scaling. This lesson is about that gap and the ideas for closing it.
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'var(--text-primary)', margin: '28px 0 10px' }}>The core tension</h2>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 18px' }}>
            Reward models are trained on human judgements. But human judgement is exactly the thing that fails to keep up. Scalable oversight asks: can we use AI to help humans supervise AI, without the helpers inheriting the same blind spots?
          </p>
          <pre style={{ background: 'var(--bg-sunken)', border: '0.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 18, fontFamily: 'var(--font-mono)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)', overflow: 'auto', margin: '0 0 20px' }}>
{`# A debate-style oversight loop (sketch)
for round in range(N):
    claim   = model_a.argue(question)
    rebuttal = model_b.critique(claim)
    judge_signal = human.prefer(claim, rebuttal)
    reward.update(judge_signal)`}
          </pre>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 28px' }}>
            None of these are solved. Each one trades one hard problem for a slightly different one — which is exactly why it's worth understanding where each approach breaks before you reach for it.
          </p>

          {/* Footer actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 22, borderTop: '0.5px solid var(--border-subtle)' }}>
            {done
              ? <Badge variant="success" dot>Marked complete</Badge>
              : <Button variant="primary" iconLeft="check" onClick={() => setDone(true)}>Mark complete</Button>}
            <Button variant="ghost" iconRight="arrow-right" onClick={onComplete} style={{ marginLeft: 'auto' }}>Next lesson</Button>
          </div>
        </div>
      </article>
    </div>
  );
}

Object.assign(window, { AppLesson });
