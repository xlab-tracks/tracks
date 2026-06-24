import React from 'react';

function useTabsStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-tabs-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-tabs-styles';
    el.textContent = `
      .xlt-tabs{display:flex;align-items:center;gap:4px;font-family:var(--font-sans);
        border-bottom:0.5px solid var(--border-subtle)}
      .xlt-tab{appearance:none;background:none;border:none;cursor:pointer;
        font-family:inherit;font-size:var(--text-body-sm);font-weight:var(--weight-medium);
        color:var(--text-secondary);padding:11px 14px;position:relative;
        display:inline-flex;align-items:center;gap:7px;transition:var(--transition-base)}
      .xlt-tab:hover{color:var(--text-primary)}
      .xlt-tab[aria-selected="true"]{color:var(--text-primary)}
      .xlt-tab[aria-selected="true"]::after{content:"";position:absolute;left:8px;right:8px;bottom:-0.5px;
        height:2px;background:var(--accent);border-radius:var(--radius-pill)}
      .xlt-tab:focus-visible{outline:none;box-shadow:var(--shadow-focus);border-radius:var(--radius-xs)}
      .xlt-tab i{font-size:1.05em}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Tabs({ items = [], value, defaultValue, onChange, className = '', ...rest }) {
  useTabsStyles();
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = isControlled ? value : internal;
  const select = (id) => { if (!isControlled) setInternal(id); onChange && onChange(id); };
  return (
    <div className={`xlt-tabs ${className}`.trim()} role="tablist" {...rest}>
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={active === it.id}
          className="xlt-tab" onClick={() => select(it.id)}>
          {it.icon && <i className={`ti ti-${it.icon}`} aria-hidden="true" />}
          {it.label}
        </button>
      ))}
    </div>
  );
}
