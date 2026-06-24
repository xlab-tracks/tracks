import React from 'react';

function useCheckboxStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-checkbox-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-checkbox-styles';
    el.textContent = `
      .xlt-check{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-sans);
        font-size:var(--text-body);color:var(--text-primary);cursor:pointer;user-select:none}
      .xlt-check__box{
        width:20px;height:20px;flex:none;display:grid;place-items:center;
        background:var(--bg-sunken);border:0.5px solid var(--border-strong);
        border-radius:var(--radius-xs);transition:var(--transition-base);color:var(--text-on-accent);
      }
      .xlt-check__box i{font-size:14px;opacity:0;transition:opacity var(--dur-fast) var(--ease-standard)}
      .xlt-check input{position:absolute;opacity:0;width:0;height:0}
      .xlt-check input:checked + .xlt-check__box{background:var(--accent);border-color:var(--accent)}
      .xlt-check input:checked + .xlt-check__box i{opacity:1}
      .xlt-check input:focus-visible + .xlt-check__box{box-shadow:var(--shadow-focus)}
      .xlt-check--disabled{opacity:.45;cursor:not-allowed}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Checkbox({ label, checked, defaultChecked, onChange, disabled, className = '', ...rest }) {
  useCheckboxStyles();
  return (
    <label className={`xlt-check ${disabled ? 'xlt-check--disabled' : ''} ${className}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="xlt-check__box"><i className="ti ti-check" aria-hidden="true" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}
