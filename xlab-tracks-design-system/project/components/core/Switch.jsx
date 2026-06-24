import React from 'react';

function useSwitchStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-switch-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-switch-styles';
    el.textContent = `
      .xlt-switch{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-sans);
        font-size:var(--text-body);color:var(--text-primary);cursor:pointer;user-select:none}
      .xlt-switch__track{
        width:40px;height:23px;flex:none;border-radius:var(--radius-pill);
        background:var(--stone-700);border:0.5px solid var(--border-default);
        position:relative;transition:var(--transition-base);
      }
      .xlt-switch__thumb{
        position:absolute;top:2.5px;left:2.5px;width:17px;height:17px;border-radius:var(--radius-pill);
        background:var(--stone-200);transition:transform var(--dur-base) var(--ease-standard),background var(--dur-fast) var(--ease-standard);
      }
      .xlt-switch input{position:absolute;opacity:0;width:0;height:0}
      .xlt-switch input:checked + .xlt-switch__track{background:var(--accent);border-color:var(--accent)}
      .xlt-switch input:checked + .xlt-switch__track .xlt-switch__thumb{transform:translateX(17px);background:var(--text-on-accent)}
      .xlt-switch input:focus-visible + .xlt-switch__track{box-shadow:var(--shadow-focus)}
      .xlt-switch--disabled{opacity:.45;cursor:not-allowed}
    `;
    document.head.appendChild(el);
  }, []);
}

export function Switch({ label, checked, defaultChecked, onChange, disabled, className = '', ...rest }) {
  useSwitchStyles();
  return (
    <label className={`xlt-switch ${disabled ? 'xlt-switch--disabled' : ''} ${className}`.trim()}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
      <span className="xlt-switch__track"><span className="xlt-switch__thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}
