import React from 'react';

function useCardStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-card-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-card-styles';
    el.textContent = `
      .xlt-card{
        display:block;background:var(--surface-card);
        border:0.5px solid var(--border-default);
        border-radius:var(--radius-md);padding:var(--pad-card);
        color:var(--text-primary);
      }
      .xlt-card--warm{background:var(--surface-warm)}
      .xlt-card--sunken{background:var(--bg-sunken)}
      .xlt-card--interactive{cursor:pointer;text-decoration:none;transition:var(--transition-base)}
      .xlt-card--interactive:hover{border-color:var(--border-strong);transform:translateY(-1px)}
      .xlt-card--interactive:active{transform:translateY(0)}
      .xlt-card--pad-lg{padding:var(--space-8)}
      .xlt-card--pad-sm{padding:var(--space-4)}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Card({
  children,
  variant = 'default',
  interactive = false,
  pad = 'md',
  as = 'div',
  className = '',
  ...rest
}) {
  useCardStyles();
  const Tag = as;
  const cls = [
    'xlt-card',
    variant !== 'default' && `xlt-card--${variant}`,
    interactive && 'xlt-card--interactive',
    pad !== 'md' && `xlt-card--pad-${pad}`,
    className,
  ].filter(Boolean).join(' ');
  return <Tag className={cls} {...rest}>{children}</Tag>;
}
