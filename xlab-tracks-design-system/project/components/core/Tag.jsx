import React from 'react';

function useTagStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-tag-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-tag-styles';
    el.textContent = `
      .xlt-tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
        font-size:var(--text-caption);color:var(--text-secondary);
        background:transparent;border:0.5px solid var(--border-default);
        border-radius:var(--radius-pill);padding:4px 12px;transition:var(--transition-base)}
      .xlt-tag--selected{color:var(--text-on-accent);background:var(--accent);border-color:var(--accent)}
      .xlt-tag--button{cursor:pointer}
      .xlt-tag--button:hover:not(.xlt-tag--selected){border-color:var(--border-strong);color:var(--text-primary)}
      .xlt-tag__remove{cursor:pointer;opacity:.7;font-size:1.05em;display:inline-flex}
      .xlt-tag__remove:hover{opacity:1}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Tag({ children, selected = false, onClick, onRemove, className = '', ...rest }) {
  useTagStyles();
  const clickable = !!onClick;
  return (
    <span
      className={`xlt-tag ${selected ? 'xlt-tag--selected' : ''} ${clickable ? 'xlt-tag--button' : ''} ${className}`.trim()}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      {...rest}
    >
      {children}
      {onRemove && (
        <i className="ti ti-x xlt-tag__remove" aria-label="Remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }} />
      )}
    </span>
  );
}
