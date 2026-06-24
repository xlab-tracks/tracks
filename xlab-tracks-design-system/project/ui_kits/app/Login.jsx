/* Sign-in screen. Exposes AppLogin to window. */
const NS_LOGIN = window.XLabTracksDesignSystem_8f3d24;

function AppLogin({ onSignIn }) {
  const { Button, Input, Checkbox } = NS_LOGIN;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Brand panel */}
      <div style={{ background: 'var(--surface-warm)', borderRight: '0.5px solid var(--border-subtle)', padding: '48px 52px', display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>
          XLab<span style={{ color: 'var(--accent)' }}> · </span>Tracks
        </span>
        <div style={{ marginTop: 'auto' }}>
          <i className="ti ti-quote" style={{ fontSize: 30, color: 'var(--accent)' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, lineHeight: 1.3, color: 'var(--text-primary)', margin: '14px 0 18px', maxWidth: '20ch' }}>
            The clearest path I've found into actually doing this work.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Priya M. — research engineer, Foundations cohort 7</p>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <form onSubmit={(e) => { e.preventDefault(); onSignIn(); }} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, color: 'var(--text-primary)', margin: '0 0 6px' }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Pick up where you left off.</p>
          </div>
          <Input label="Email" type="email" icon="mail" placeholder="you@lab.org" defaultValue="ada@lab.org" />
          <Input label="Password" type="password" icon="lock" placeholder="••••••••" defaultValue="password" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox label="Keep me signed in" defaultChecked />
            <a href="#" style={{ fontSize: 13, color: 'var(--accent-soft-text)', textDecoration: 'none' }}>Forgot?</a>
          </div>
          <Button variant="primary" size="lg" type="submit" style={{ width: '100%' }}>Sign in</Button>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            New here? <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }} style={{ color: 'var(--accent-soft-text)', textDecoration: 'none' }}>Create an account</a>
          </p>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { AppLogin });
