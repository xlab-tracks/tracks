import React from 'react';

function useProgressStyles() {
  React.useEffect(() => {
    if (document.getElementById('xlt-progress-styles')) return;
    const el = document.createElement('style');
    el.id = 'xlt-progress-styles';
    el.textContent = `
      .xlt-progress{font-family:var(--font-sans);display:flex;flex-direction:column;gap:7px;width:100%}
      .xlt-progress__head{display:flex;justify-content:space-between;align-items:baseline;
        font-size:var(--text-caption);color:var(--text-secondary)}
      .xlt-progress__value{color:var(--text-primary);font-weight:var(--weight-medium);font-variant-numeric:tabular-nums}
      .xlt-progress__track{height:8px;width:100%;background:var(--bg-sunken);
        border:0.5px solid var(--border-subtle);border-radius:var(--radius-pill);overflow:hidden}
      .xlt-progress__fill{height:100%;border-radius:var(--radius-pill);
        background:var(--accent);transition:width var(--dur-slow) var(--ease-out)}
      .xlt-progress--success .xlt-progress__fill{background:var(--success)}
      .xlt-progress--sm .xlt-progress__track{height:5px}
    `;
    document.head.appendChild(el);
  }, []);
}

export function ProgressBar({ value = 0, max = 100, label, showValue = true, size = 'md', variant = 'accent', className = '', ...rest }) {
  useProgressStyles();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const complete = pct >= 100;
  return (
    <div
      className={`xlt-progress ${size === 'sm' ? 'xlt-progress--sm' : ''} ${(complete || variant === 'success') ? 'xlt-progress--success' : ''} ${className}`.trim()}
      role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} {...rest}
    >
      {(label || showValue) && (
        <div className="xlt-progress__head">
          <span>{label}</span>
          {showValue && <span className="xlt-progress__value">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="xlt-progress__track"><div className="xlt-progress__fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
