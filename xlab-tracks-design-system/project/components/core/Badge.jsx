import React from 'react';

function useBadgeStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-badge-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-badge-styles';
    el.textContent = `
      .xlt-badge{
        display:inline-flex;align-items:center;gap:6px;
        font-family:var(--font-sans);font-weight:var(--weight-medium);
        font-size:var(--text-overline);line-height:1;
        padding:5px 11px;border-radius:var(--radius-sm);
        border:0.5px solid transparent;white-space:nowrap;
      }
      .xlt-badge--accent{background:var(--accent-soft-bg);color:var(--accent-soft-text)}
      .xlt-badge--neutral{background:color-mix(in oklch,var(--stone-100) 7%,transparent);color:var(--text-secondary)}
      .xlt-badge--success{background:color-mix(in oklch,var(--success) 18%,transparent);color:var(--sage-300)}
      .xlt-badge--warning{background:color-mix(in oklch,var(--warning) 18%,transparent);color:var(--amber-300)}
      .xlt-badge--danger{background:color-mix(in oklch,var(--danger) 18%,transparent);color:var(--clay-300)}
      .xlt-badge--outline{background:transparent;color:var(--text-secondary);border-color:var(--border-default)}
      .xlt-badge__dot{width:6px;height:6px;border-radius:var(--radius-pill);background:currentColor}
      .xlt-badge__icon{font-size:1.05em;line-height:1}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Badge({ children, variant = 'accent', dot = false, icon, className = '', ...rest }) {
  useBadgeStyles();
  return (
    <span className={`xlt-badge xlt-badge--${variant} ${className}`.trim()} {...rest}>
      {dot && <span className="xlt-badge__dot" aria-hidden="true" />}
      {icon && <i className={`ti ti-${icon} xlt-badge__icon`} aria-hidden="true" />}
      {children}
    </span>
  );
}
