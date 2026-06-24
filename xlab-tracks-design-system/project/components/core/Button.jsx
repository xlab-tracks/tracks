import React from 'react';

/* Injects component styles once (real :hover/:active/:focus-visible),
   all values pulled from the design-system CSS custom properties. */
function useButtonStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-button-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-button-styles';
    el.textContent = `
      .xlt-btn{
        display:inline-flex;align-items:center;justify-content:center;gap:8px;
        font-family:var(--font-sans);font-weight:var(--weight-medium);
        border-radius:var(--radius-sm);border:0.5px solid transparent;
        cursor:pointer;white-space:nowrap;text-decoration:none;
        transition:var(--transition-base);
      }
      .xlt-btn:focus-visible{outline:none;box-shadow:var(--shadow-focus)}
      .xlt-btn:disabled,.xlt-btn[aria-disabled="true"]{opacity:.45;cursor:not-allowed}
      .xlt-btn--sm{font-size:var(--text-body-sm);padding:7px 14px}
      .xlt-btn--md{font-size:var(--text-body);padding:10px 20px}
      .xlt-btn--lg{font-size:var(--text-body-lg);padding:13px 26px}
      /* primary */
      .xlt-btn--primary{background:var(--accent);color:var(--text-on-accent)}
      .xlt-btn--primary:hover:not(:disabled){background:var(--accent-hover)}
      .xlt-btn--primary:active:not(:disabled){transform:translateY(0.5px)}
      /* secondary (outline rose) */
      .xlt-btn--secondary{background:transparent;color:var(--accent-2-text);border-color:var(--accent-2)}
      .xlt-btn--secondary:hover:not(:disabled){background:color-mix(in oklch,var(--accent-2) 14%,transparent)}
      /* ghost */
      .xlt-btn--ghost{background:transparent;color:var(--text-primary)}
      .xlt-btn--ghost:hover:not(:disabled){background:color-mix(in oklch,var(--stone-100) 8%,transparent)}
      /* danger */
      .xlt-btn--danger{background:var(--danger);color:var(--stone-50)}
      .xlt-btn--danger:hover:not(:disabled){background:color-mix(in oklch,var(--danger) 82%,black)}
      .xlt-btn__icon{font-size:1.15em;line-height:1;display:inline-flex}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled = false,
  as = 'button',
  className = '',
  ...rest
}) {
  useButtonStyles();
  const Tag = as;
  const cls = `xlt-btn xlt-btn--${variant} xlt-btn--${size} ${className}`.trim();
  return (
    <Tag
      className={cls}
      disabled={Tag === 'button' ? disabled : undefined}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {iconLeft && <i className={`ti ti-${iconLeft} xlt-btn__icon`} aria-hidden="true" />}
      {children}
      {iconRight && <i className={`ti ti-${iconRight} xlt-btn__icon`} aria-hidden="true" />}
    </Tag>
  );
}
