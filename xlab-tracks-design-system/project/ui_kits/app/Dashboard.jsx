/* Learner dashboard. Exposes AppDashboard to window. */
const NS_DASH = window.XLabTracksDesignSystem_8f3d24;

const MY_TRACKS = [
  { icon: 'route', title: 'Foundations of AI safety', done: 5, total: 8, next: 'Threat models, mapped', accent: 'var(--accent)' },
  { icon: 'eye', title: 'Interpretability', done: 2, total: 10, next: 'Features & superposition', accent: 'var(--rose-400)' },
  { icon: 'shield-half', title: 'Evaluations & red-teaming', done: 9, total: 9, next: 'Track complete', accent: 'var(--slate-400)' },
];

function AppDashboard({ user, onOpenLesson }) {
  const { Card, Button, Badge, ProgressBar } = NS_DASH;
  const cont = MY_TRACKS[0];
  return (
    <div style={{ padding: '32px 28px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, color: 'var(--text-primary)', margin: '0 0 4px' }}>
        Welcome back, {user.name.split(' ')[0]}.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 28px' }}>You're 5 lessons into Foundations. Keep the thread going.</p>

      {/* Continue card */}
      <Card variant="warm" pad="lg" style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 30 }}>
        <i className={`ti ti-${cont.icon}`} style={{ fontSize: 34, color: 'var(--accent)' }} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Badge variant="outline">Continue</Badge>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--text-primary)', margin: '10px 0 4px' }}>{cont.title}</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 12px' }}>Up next — Lesson {cont.done + 1}: {cont.next}</p>
          <div style={{ maxWidth: 360 }}><ProgressBar value={cont.done} max={cont.total} size="sm" label={`${cont.done} of ${cont.total} lessons`} /></div>
        </div>
        <Button variant="primary" size="lg" iconRight="player-play" onClick={onOpenLesson}>Resume</Button>
      </Card>

      {/* In progress */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Your tracks</h2>
        <a href="#" style={{ fontSize: 13, color: 'var(--accent-soft-text)', textDecoration: 'none' }}>Browse catalogue →</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {MY_TRACKS.map((t) => {
          const complete = t.done >= t.total;
          return (
            <Card key={t.title} interactive as="a" href="#" onClick={(e) => { e.preventDefault(); onOpenLesson(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <i className={`ti ti-${t.icon}`} style={{ fontSize: 24, color: t.accent }} aria-hidden="true" />
                {complete && <Badge variant="success" dot>Done</Badge>}
              </div>
              <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>{t.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{complete ? 'Certificate ready' : t.next}</p>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <ProgressBar value={t.done} max={t.total} size="sm" showValue={false} variant={complete ? 'success' : 'accent'} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* This week */}
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' }}>This week in your cohort</h2>
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
        {[
          { icon: 'calendar-event', t: 'Live session — Threat models', d: 'Thursday, 6:00pm · with Dr. Reyes', tag: 'In 2 days' },
          { icon: 'message-circle', t: '4 new replies in your study group', d: 'On "Why is reward hacking hard to detect?"', tag: 'New' },
          { icon: 'pencil', t: 'Exercise feedback returned', d: 'Mentor notes on your eval write-up', tag: '' },
        ].map((r, i) => (
          <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderTop: i ? '0.5px solid var(--border-subtle)' : 'none' }}>
            <i className={`ti ti-${r.icon}`} style={{ fontSize: 20, color: 'var(--text-secondary)' }} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 2px' }}>{r.t}</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>{r.d}</p>
            </div>
            {r.tag && <Badge variant={r.tag === 'New' ? 'accent' : 'neutral'}>{r.tag}</Badge>}
          </div>
        ))}
      </Card>
    </div>
  );
}

Object.assign(window, { AppDashboard });
