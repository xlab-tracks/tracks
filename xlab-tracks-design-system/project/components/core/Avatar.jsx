import React from 'react';

function useAvatarStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-avatar-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-avatar-styles';
    el.textContent = `
      .xlt-avatar{display:inline-flex;align-items:center;justify-content:center;flex:none;
        font-family:var(--font-sans);font-weight:var(--weight-medium);color:var(--text-on-accent);
        background:var(--accent);border-radius:var(--radius-pill);overflow:hidden;
        border:0.5px solid color-mix(in oklch,black 18%,transparent)}
      .xlt-avatar img{width:100%;height:100%;object-fit:cover;display:block}
      .xlt-avatar--sm{width:28px;height:28px;font-size:12px}
      .xlt-avatar--md{width:38px;height:38px;font-size:14px}
      .xlt-avatar--lg{width:52px;height:52px;font-size:18px}
      .xlt-avatar--rose{background:var(--accent-2)}
      .xlt-avatar--neutral{background:var(--stone-700);color:var(--text-primary)}
    `;
    document.head.appendChild(el);
  }, []);
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function Avatar({ name = '', src, size = 'md', tone = 'accent', className = '', ...rest }) {
  useAvatarStyles();
  return (
    <span className={`xlt-avatar xlt-avatar--${size} xlt-avatar--${tone} ${className}`.trim()}
      title={name || undefined} {...rest}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}
