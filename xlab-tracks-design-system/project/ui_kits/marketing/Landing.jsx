/* Marketing landing page. Composes DS components. Exposes MktLanding to window. */
const NS_LAND = window.XLabTracksDesignSystem_8f3d24;

const TRACKS = [
  { icon: 'route', title: 'Foundations of AI safety', desc: 'The core problem, the main threat models, and why this is hard. Start here.', lessons: 8, weeks: 4, level: 'Beginner', accent: 'var(--accent)' },
  { icon: 'eye', title: 'Interpretability', desc: 'Open the black box. Features, circuits, and probing what a model knows.', lessons: 10, weeks: 6, level: 'Intermediate', accent: 'var(--rose-400)' },
  { icon: 'shield-half', title: 'Evaluations & red-teaming', desc: 'Measure capability and risk. Build evals that actually catch failures.', lessons: 9, weeks: 5, level: 'Intermediate', accent: 'var(--slate-400)' },
  { icon: 'scale', title: 'Alignment theory', desc: 'Reward modelling, RLHF, scalable oversight, and where they break.', lessons: 12, weeks: 7, level: 'Advanced', accent: 'var(--accent)' },
  { icon: 'gavel', title: 'AI governance', desc: 'Policy, standards, and the levers outside the model. For non-engineers too.', lessons: 7, weeks: 4, level: 'Beginner', accent: 'var(--rose-400)' },
  { icon: 'building-bank', title: 'RLHF in practice', desc: 'Hands-on: train a reward model and fine-tune with human feedback.', lessons: 11, weeks: 6, level: 'Advanced', accent: 'var(--slate-400)' },
];

const STEPS = [
  { icon: 'book-2', t: 'Read the lesson', d: 'Short, dense, written by people who do the work. 20 minutes, no padding.', time: '~20 min' },
  { icon: 'tool', t: 'Build something', d: 'Every lesson ends with an exercise you run yourself — code or written.', time: '~45 min' },
  { icon: 'message-circle', t: 'Discuss in cohort', d: 'Bring it to your weekly group and a mentor. Then move to the next.', time: 'weekly' },
];

function MktLanding({ onNav }) {
  const { Button, Badge, Card, Tag, ProgressBar } = NS_LAND;
  return (
    <main>
      {/* Hero */}
      <section style={{ padding: '76px 40px 56px', maxWidth: 1080, margin: '0 auto' }}>
        <Badge>New cohort starts July 14</Badge>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--text-primary)', margin: '20px 0 18px', maxWidth: '16ch' }}>
          Learn to make AI go well.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '54ch', margin: '0 0 28px' }}>
          Structured tracks in AI safety — alignment, interpretability, evaluations — built by researchers and paced for working people. No hype, no firehose. Just the path, one lesson at a time.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button variant="primary" size="lg" iconLeft="flame">Browse tracks</Button>
          <Button variant="secondary" size="lg">See the syllabus</Button>
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 34, flexWrap: 'wrap' }}>
          {[['6', 'tracks'], ['57', 'lessons'], ['1,400+', 'learners'], ['12', 'mentors']].map(([n, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, color: 'var(--text-primary)' }}>{n}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks */}
      <section style={{ padding: '8px 40px 64px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-soft-text)', margin: '0 0 6px' }}>The catalogue</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, color: 'var(--text-primary)', margin: 0 }}>Pick a track. Start anywhere.</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tag selected>All</Tag><Tag>Beginner</Tag><Tag>Advanced</Tag>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {TRACKS.map((t) => (
            <Card key={t.title} interactive as="a" href="#" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <i className={`ti ti-${t.icon}`} style={{ fontSize: 26, color: t.accent }} aria-hidden="true" />
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, color: 'var(--text-primary)', margin: '0 0 6px' }}>{t.title}</p>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{t.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="ti ti-book" /> {t.lessons} lessons</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i className="ti ti-clock" /> {t.weeks} weeks</span>
                <span style={{ marginLeft: 'auto', color: 'var(--accent-soft-text)' }}>{t.level}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works (warm band) */}
      <section style={{ background: 'var(--surface-warm)', padding: '56px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-soft-text)', margin: '0 0 6px' }}>How it works</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, color: 'var(--text-primary)', margin: '0 0 30px' }}>Read, build, discuss. Then again.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {STEPS.map((s, i) => (
              <div key={s.t}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <i className={`ti ti-${s.icon}`} style={{ fontSize: 22, color: 'var(--accent)' }} aria-hidden="true" />
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.time}</span>
                </div>
                <p style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', margin: '0 0 6px' }}>{i + 1}. {s.t}</p>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0, maxWidth: '34ch' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 40px', maxWidth: 1080, margin: '0 auto' }}>
        <Card variant="default" pad="lg" style={{ textAlign: 'center', padding: '44px 32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, color: 'var(--text-primary)', margin: '0 0 10px' }}>Learn at your own pace</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '46ch', margin: '0 auto 24px' }}>
            Audit any track free, forever. Join a cohort for live discussion, mentor feedback, and a certificate — $29 a month, cancel whenever.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="primary" size="lg">Start for free</Button>
            <Button variant="ghost" size="lg" onClick={() => onNav('pricing')}>Compare plans</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

Object.assign(window, { MktLanding });
