/* Learner app shell: left sidebar + top bar. Exposes AppShell to window. */
const NS_SHELL = window.XLabTracksDesignSystem_8f3d24;

function AppShell({ active, onNav, onOpenSearch, children, user }) {
  const { Avatar } = NS_SHELL;
  const items = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'tracks', icon: 'route', label: 'My tracks' },
    { id: 'catalogue', icon: 'books', label: 'Catalogue' },
    { id: 'discuss', icon: 'message-circle', label: 'Discussion' },
    { id: 'certs', icon: 'certificate', label: 'Certificates' },
  ];
  const navItem = (it) => {
    const on = active === it.id || (active === 'lesson' && it.id === 'tracks');
    return (
      <a key={it.id} href="#" onClick={(e) => { e.preventDefault(); onNav(it.id); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px',
          borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
          color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: on ? 'color-mix(in oklch, var(--stone-100) 7%, transparent)' : 'transparent',
        }}>
        <i className={`ti ti-${it.icon}`} style={{ fontSize: 18, color: on ? 'var(--accent)' : 'var(--text-muted)' }} aria-hidden="true" />
        {it.label}
      </a>
    );
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '236px 1fr', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{ background: 'var(--bg-sunken)', borderRight: '0.5px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', padding: '20px 16px', position: 'sticky', top: 0, height: '100vh' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--text-primary)', padding: '0 8px 18px' }}>
          XLab<span style={{ color: 'var(--accent)' }}> · </span>Tracks
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{items.map(navItem)}</nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItem({ id: 'settings', icon: 'settings', label: 'Settings' })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', marginTop: 6, borderTop: '0.5px solid var(--border-subtle)' }}>
            <Avatar name={user.name} size="sm" />
            <div style={{ lineHeight: 1.2, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Member</div>
            </div>
          </div>
        </div>
      </aside>
      {/* Main column */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 28px', borderBottom: '0.5px solid var(--border-subtle)', position: 'sticky', top: 0, background: 'color-mix(in oklch, var(--bg-base) 90%, transparent)', backdropFilter: 'blur(8px)', zIndex: 5 }}>
          <button onClick={onOpenSearch} style={{ flex: 1, maxWidth: 380, display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: 'var(--bg-sunken)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 13.5, fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left' }}>
            <i className="ti ti-search" style={{ fontSize: 16 }} /> Search tracks & lessons
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <i className="ti ti-flame" style={{ fontSize: 18, color: 'var(--accent)' }} title="3-day streak" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>3-day streak</span>
            <i className="ti ti-bell" style={{ fontSize: 18, color: 'var(--text-secondary)' }} />
          </div>
        </header>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { AppShell });
