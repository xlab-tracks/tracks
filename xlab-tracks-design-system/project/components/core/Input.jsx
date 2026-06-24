import React from 'react';

function useInputStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-input-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-input-styles';
    el.textContent = `
      .xlt-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans)}
      .xlt-field__label{font-size:var(--text-caption);font-weight:var(--weight-medium);color:var(--text-secondary)}
      .xlt-input-wrap{position:relative;display:flex;align-items:center}
      .xlt-input-wrap__icon{position:absolute;left:12px;color:var(--text-muted);font-size:16px;pointer-events:none}
      .xlt-input{
        width:100%;box-sizing:border-box;
        font-family:var(--font-sans);font-size:var(--text-body);color:var(--text-primary);
        background:var(--bg-sunken);border:0.5px solid var(--border-default);
        border-radius:var(--radius-sm);padding:10px 14px;
        transition:var(--transition-base);
      }
      .xlt-input--with-icon{padding-left:38px}
      .xlt-input::placeholder{color:var(--text-muted)}
      .xlt-input:hover{border-color:var(--border-strong)}
      .xlt-input:focus{outline:none;border-color:var(--accent);box-shadow:var(--shadow-focus)}
      .xlt-input:disabled{opacity:.5;cursor:not-allowed}
      .xlt-input--error{border-color:var(--danger)}
      .xlt-field__hint{font-size:var(--text-caption);color:var(--text-muted)}
      .xlt-field__hint--error{color:var(--clay-300)}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Input({ label, icon, hint, error, id, className = '', ...rest }) {
  useInputStyles();
  const inputId = id || (label ? `xlt-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return (
    <div className="xlt-field">
      {label && <label className="xlt-field__label" htmlFor={inputId}>{label}</label>}
      <div className="xlt-input-wrap">
        {icon && <i className={`ti ti-${icon} xlt-input-wrap__icon`} aria-hidden="true" />}
        <input
          id={inputId}
          className={`xlt-input ${icon ? 'xlt-input--with-icon' : ''} ${error ? 'xlt-input--error' : ''} ${className}`.trim()}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <span className={`xlt-field__hint ${error ? 'xlt-field__hint--error' : ''}`.trim()}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
