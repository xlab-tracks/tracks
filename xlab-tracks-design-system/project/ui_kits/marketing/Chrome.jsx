/* Marketing site shared chrome: top nav + footer. Exposes to window. */
const NS_MKT = window.XLabTracksDesignSystem_8f3d24;

function MktNav({ page, onNav }) {
  const { Button } = NS_MKT;
  const link = (id, label) => (
    React.createElement('a', {
      href: '#', onClick: (e) => { e.preventDefault(); onNav(id); },
      style: {
        color: page === id ? 'var(--text-primary)' : 'var(--stone-200)',
        textDecoration: 'none', fontSize: 14, fontWeight: 500,
      },
    }, label)
  );
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 40px', borderBottom: '0.5px solid var(--border-subtle)',
      position: 'sticky', top: 0, background: 'color-mix(in oklch, var(--bg-base) 88%, transparent)',
      backdropFilter: 'blur(8px)', zIndex: 10,
    }}>
      <span onClick={() => onNav('home')} style={{ cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        XLab<span style={{ color: 'var(--accent)' }}> · </span>Tracks
      </span>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {link('home', 'Tracks')}
        {link('home', 'How it works')}
        {link('pricing', 'Pricing')}
        <a href="#" style={{ color: 'var(--stone-200)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>For teams</a>
        <Button size="sm" variant="ghost">Sign in</Button>
        <Button size="sm" variant="primary" iconRight="arrow-right">Browse tracks</Button>
      </nav>
    </header>
  );
}

function MktFooter() {
  const col = (title, items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{title}</span>
      {items.map((t) => <a key={t} href="#" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>{t}</a>)}
    </div>
  );
  return (
    <footer style={{
      display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 28,
      padding: '40px 40px 48px', background: 'var(--bg-sunken)', borderTop: '0.5px solid var(--border-subtle)',
    }}>
      <div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
          XLab<span style={{ color: 'var(--accent)' }}> · </span>Tracks
        </span>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '34ch', margin: '12px 0 0' }}>
          Structured learning in AI safety. Built by researchers, paced for working people.
        </p>
      </div>
      {col('Learn', ['All tracks', 'Cohorts', 'For teams', 'Syllabus'])}
      {col('About', ['Our approach', 'Mentors', 'Careers', 'Blog'])}
      {col('More', ['Help', 'Community', 'Privacy', 'Contact'])}
    </footer>
  );
}

Object.assign(window, { MktNav, MktFooter });
