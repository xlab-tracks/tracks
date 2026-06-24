/* @ds-bundle: {"format":3,"namespace":"XLabTracksDesignSystem_8f3d24","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"43aa2e970a5a","components/core/Badge.jsx":"7004e098c03b","components/core/Button.jsx":"fea19a6d30fc","components/core/Card.jsx":"c59aea3af0b9","components/core/Checkbox.jsx":"140d65ba4947","components/core/Input.jsx":"38f0de611f66","components/core/ProgressBar.jsx":"f1be8706e845","components/core/Switch.jsx":"9170bc5bdd80","components/core/Tabs.jsx":"e872ec7ee98c","components/core/Tag.jsx":"cc3ebae2a708","ui_kits/app/AppShell.jsx":"032dba37915e","ui_kits/app/Dashboard.jsx":"9bf0a59d802e","ui_kits/app/Lesson.jsx":"32ba7e9ca17d","ui_kits/app/Login.jsx":"a7e037244842","ui_kits/marketing/Chrome.jsx":"a5e24a3d8562","ui_kits/marketing/Landing.jsx":"64c22563177d","ui_kits/marketing/Pricing.jsx":"ee3e0a63c7fa"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.XLabTracksDesignSystem_8f3d24 = window.XLabTracksDesignSystem_8f3d24 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Avatar({
  name = '',
  src,
  size = 'md',
  tone = 'accent',
  className = '',
  ...rest
}) {
  useAvatarStyles();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `xlt-avatar xlt-avatar--${size} xlt-avatar--${tone} ${className}`.trim(),
    title: name || undefined
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Badge({
  children,
  variant = 'accent',
  dot = false,
  icon,
  className = '',
  ...rest
}) {
  useBadgeStyles();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `xlt-badge xlt-badge--${variant} ${className}`.trim()
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "xlt-badge__dot",
    "aria-hidden": "true"
  }), icon && /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon} xlt-badge__icon`,
    "aria-hidden": "true"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Button({
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
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    disabled: Tag === 'button' ? disabled : undefined,
    "aria-disabled": disabled || undefined
  }, rest), iconLeft && /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${iconLeft} xlt-btn__icon`,
    "aria-hidden": "true"
  }), children, iconRight && /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${iconRight} xlt-btn__icon`,
    "aria-hidden": "true"
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Card({
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
  const cls = ['xlt-card', variant !== 'default' && `xlt-card--${variant}`, interactive && 'xlt-card--interactive', pad !== 'md' && `xlt-card--pad-${pad}`, className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  className = '',
  ...rest
}) {
  useCheckboxStyles();
  return /*#__PURE__*/React.createElement("label", {
    className: `xlt-check ${disabled ? 'xlt-check--disabled' : ''} ${className}`.trim()
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "xlt-check__box"
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-check",
    "aria-hidden": "true"
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Input({
  label,
  icon,
  hint,
  error,
  id,
  className = '',
  ...rest
}) {
  useInputStyles();
  const inputId = id || (label ? `xlt-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: "xlt-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "xlt-field__label",
    htmlFor: inputId
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "xlt-input-wrap"
  }, icon && /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon} xlt-input-wrap__icon`,
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    className: `xlt-input ${icon ? 'xlt-input--with-icon' : ''} ${error ? 'xlt-input--error' : ''} ${className}`.trim()
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    className: `xlt-field__hint ${error ? 'xlt-field__hint--error' : ''}`.trim()
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  variant = 'accent',
  className = '',
  ...rest
}) {
  useProgressStyles();
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const complete = pct >= 100;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `xlt-progress ${size === 'sm' ? 'xlt-progress--sm' : ''} ${complete || variant === 'success' ? 'xlt-progress--success' : ''} ${className}`.trim(),
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemin": 0,
    "aria-valuemax": max
  }, rest), (label || showValue) && /*#__PURE__*/React.createElement("div", {
    className: "xlt-progress__head"
  }, /*#__PURE__*/React.createElement("span", null, label), showValue && /*#__PURE__*/React.createElement("span", {
    className: "xlt-progress__value"
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    className: "xlt-progress__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "xlt-progress__fill",
    style: {
      width: `${pct}%`
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  className = '',
  ...rest
}) {
  useSwitchStyles();
  return /*#__PURE__*/React.createElement("label", {
    className: `xlt-switch ${disabled ? 'xlt-switch--disabled' : ''} ${className}`.trim()
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "xlt-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "xlt-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/core/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  className = '',
  ...rest
}) {
  useTabsStyles();
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = isControlled ? value : internal;
  const select = id => {
    if (!isControlled) setInternal(id);
    onChange && onChange(id);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `xlt-tabs ${className}`.trim(),
    role: "tablist"
  }, rest), items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    role: "tab",
    "aria-selected": active === it.id,
    className: "xlt-tab",
    onClick: () => select(it.id)
  }, it.icon && /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${it.icon}`,
    "aria-hidden": "true"
  }), it.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Tag({
  children,
  selected = false,
  onClick,
  onRemove,
  className = '',
  ...rest
}) {
  useTagStyles();
  const clickable = !!onClick;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `xlt-tag ${selected ? 'xlt-tag--selected' : ''} ${clickable ? 'xlt-tag--button' : ''} ${className}`.trim(),
    onClick: onClick,
    role: clickable ? 'button' : undefined
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("i", {
    className: "ti ti-x xlt-tag__remove",
    "aria-label": "Remove",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    }
  }));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
/* Learner app shell: left sidebar + top bar. Exposes AppShell to window. */
const NS_SHELL = window.XLabTracksDesignSystem_8f3d24;
function AppShell({
  active,
  onNav,
  onOpenSearch,
  children,
  user
}) {
  const {
    Avatar
  } = NS_SHELL;
  const items = [{
    id: 'dashboard',
    icon: 'home',
    label: 'Home'
  }, {
    id: 'tracks',
    icon: 'route',
    label: 'My tracks'
  }, {
    id: 'catalogue',
    icon: 'books',
    label: 'Catalogue'
  }, {
    id: 'discuss',
    icon: 'message-circle',
    label: 'Discussion'
  }, {
    id: 'certs',
    icon: 'certificate',
    label: 'Certificates'
  }];
  const navItem = it => {
    const on = active === it.id || active === 'lesson' && it.id === 'tracks';
    return /*#__PURE__*/React.createElement("a", {
      key: it.id,
      href: "#",
      onClick: e => {
        e.preventDefault();
        onNav(it.id);
      },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '9px 12px',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 500,
        color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: on ? 'color-mix(in oklch, var(--stone-100) 7%, transparent)' : 'transparent'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `ti ti-${it.icon}`,
      style: {
        fontSize: 18,
        color: on ? 'var(--accent)' : 'var(--text-muted)'
      },
      "aria-hidden": "true"
    }), it.label);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '236px 1fr',
      minHeight: '100vh',
      background: 'var(--bg-base)'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      background: 'var(--bg-sunken)',
      borderRight: '0.5px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      position: 'sticky',
      top: 0,
      height: '100vh'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 19,
      color: 'var(--text-primary)',
      padding: '0 8px 18px'
    }
  }, "XLab", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, " \xB7 "), "Tracks"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, items.map(navItem)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, navItem({
    id: 'settings',
    icon: 'settings',
    label: 'Settings'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 8px',
      marginTop: 6,
      borderTop: '0.5px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: user.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.2,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-primary)',
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }
  }, user.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-muted)'
    }
  }, "Member"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 28px',
      borderBottom: '0.5px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      background: 'color-mix(in oklch, var(--bg-base) 90%, transparent)',
      backdropFilter: 'blur(8px)',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpenSearch,
    style: {
      flex: 1,
      maxWidth: 380,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '8px 12px',
      background: 'var(--bg-sunken)',
      border: '0.5px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-muted)',
      fontSize: 13.5,
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-search",
    style: {
      fontSize: 16
    }
  }), " Search tracks & lessons"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-flame",
    style: {
      fontSize: 18,
      color: 'var(--accent)'
    },
    title: "3-day streak"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, "3-day streak"), /*#__PURE__*/React.createElement("i", {
    className: "ti ti-bell",
    style: {
      fontSize: 18,
      color: 'var(--text-secondary)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children)));
}
Object.assign(window, {
  AppShell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Dashboard.jsx
try { (() => {
/* Learner dashboard. Exposes AppDashboard to window. */
const NS_DASH = window.XLabTracksDesignSystem_8f3d24;
const MY_TRACKS = [{
  icon: 'route',
  title: 'Foundations of AI safety',
  done: 5,
  total: 8,
  next: 'Threat models, mapped',
  accent: 'var(--accent)'
}, {
  icon: 'eye',
  title: 'Interpretability',
  done: 2,
  total: 10,
  next: 'Features & superposition',
  accent: 'var(--rose-400)'
}, {
  icon: 'shield-half',
  title: 'Evaluations & red-teaming',
  done: 9,
  total: 9,
  next: 'Track complete',
  accent: 'var(--slate-400)'
}];
function AppDashboard({
  user,
  onOpenLesson
}) {
  const {
    Card,
    Button,
    Badge,
    ProgressBar
  } = NS_DASH;
  const cont = MY_TRACKS[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '32px 28px',
      maxWidth: 980,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 30,
      color: 'var(--text-primary)',
      margin: '0 0 4px'
    }
  }, "Welcome back, ", user.name.split(' ')[0], "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--text-secondary)',
      margin: '0 0 28px'
    }
  }, "You're 5 lessons into Foundations. Keep the thread going."), /*#__PURE__*/React.createElement(Card, {
    variant: "warm",
    pad: "lg",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${cont.icon}`,
    style: {
      fontSize: 34,
      color: 'var(--accent)'
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "outline"
  }, "Continue"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 20,
      color: 'var(--text-primary)',
      margin: '10px 0 4px'
    }
  }, cont.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      margin: '0 0 12px'
    }
  }, "Up next \u2014 Lesson ", cont.done + 1, ": ", cont.next), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 360
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: cont.done,
    max: cont.total,
    size: "sm",
    label: `${cont.done} of ${cont.total} lessons`
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconRight: "player-play",
    onClick: onOpenLesson
  }, "Resume")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--text-primary)',
      margin: 0
    }
  }, "Your tracks"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 13,
      color: 'var(--accent-soft-text)',
      textDecoration: 'none'
    }
  }, "Browse catalogue \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 32
    }
  }, MY_TRACKS.map(t => {
    const complete = t.done >= t.total;
    return /*#__PURE__*/React.createElement(Card, {
      key: t.title,
      interactive: true,
      as: "a",
      href: "#",
      onClick: e => {
        e.preventDefault();
        onOpenLesson();
      },
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `ti ti-${t.icon}`,
      style: {
        fontSize: 24,
        color: t.accent
      },
      "aria-hidden": "true"
    }), complete && /*#__PURE__*/React.createElement(Badge, {
      variant: "success",
      dot: true
    }, "Done")), /*#__PURE__*/React.createElement("p", {
      style: {
        fontWeight: 600,
        fontSize: 16,
        color: 'var(--text-primary)',
        margin: 0
      }
    }, t.title), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)',
        margin: 0
      }
    }, complete ? 'Certificate ready' : t.next), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        paddingTop: 8
      }
    }, /*#__PURE__*/React.createElement(ProgressBar, {
      value: t.done,
      max: t.total,
      size: "sm",
      showValue: false,
      variant: complete ? 'success' : 'accent'
    })));
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--text-primary)',
      margin: '0 0 14px'
    }
  }, "This week in your cohort"), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      padding: 0,
      overflow: 'hidden'
    }
  }, [{
    icon: 'calendar-event',
    t: 'Live session — Threat models',
    d: 'Thursday, 6:00pm · with Dr. Reyes',
    tag: 'In 2 days'
  }, {
    icon: 'message-circle',
    t: '4 new replies in your study group',
    d: 'On "Why is reward hacking hard to detect?"',
    tag: 'New'
  }, {
    icon: 'pencil',
    t: 'Exercise feedback returned',
    d: 'Mentor notes on your eval write-up',
    tag: ''
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '15px 18px',
      borderTop: i ? '0.5px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${r.icon}`,
    style: {
      fontSize: 20,
      color: 'var(--text-secondary)'
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-primary)',
      margin: '0 0 2px'
    }
  }, r.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      margin: 0
    }
  }, r.d)), r.tag && /*#__PURE__*/React.createElement(Badge, {
    variant: r.tag === 'New' ? 'accent' : 'neutral'
  }, r.tag)))));
}
Object.assign(window, {
  AppDashboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Lesson.jsx
try { (() => {
/* Lesson reader: lesson list rail + content. Exposes AppLesson to window. */
const NS_LESSON = window.XLabTracksDesignSystem_8f3d24;
const LESSONS = [{
  n: 1,
  t: 'What we mean by "AI safety"',
  done: true
}, {
  n: 2,
  t: 'The alignment problem',
  done: true
}, {
  n: 3,
  t: 'Specification & reward hacking',
  done: true
}, {
  n: 4,
  t: 'Goal misgeneralisation',
  done: true
}, {
  n: 5,
  t: 'Threat models, mapped',
  done: true
}, {
  n: 6,
  t: 'Oversight & scalability',
  done: false,
  current: true
}, {
  n: 7,
  t: 'Interpretability, briefly',
  done: false
}, {
  n: 8,
  t: 'Where the field is going',
  done: false
}];
function AppLesson({
  onBack,
  onComplete
}) {
  const {
    Button,
    Badge,
    Tabs,
    ProgressBar
  } = NS_LESSON;
  const [done, setDone] = React.useState(false);
  const completed = LESSONS.filter(l => l.done).length + (done ? 1 : 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      minHeight: '100%'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      borderRight: '0.5px solid var(--border-subtle)',
      padding: '24px 18px',
      background: 'var(--bg-base)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      color: 'var(--text-secondary)',
      fontSize: 13,
      cursor: 'pointer',
      padding: 0,
      marginBottom: 16,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-arrow-left"
  }), " All tracks"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-route",
    style: {
      fontSize: 22,
      color: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 17,
      color: 'var(--text-primary)',
      margin: 0
    }
  }, "Foundations of AI safety")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 0 18px'
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: completed,
    max: LESSONS.length,
    size: "sm",
    label: "Track progress"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, LESSONS.map(l => {
    const isDone = l.done || l.current && done;
    const cur = l.current;
    return /*#__PURE__*/React.createElement("div", {
      key: l.n,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 10px',
        borderRadius: 'var(--radius-sm)',
        background: cur ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'transparent',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `ti ti-${isDone ? 'circle-check-filled' : cur ? 'player-play-filled' : 'circle'}`,
      style: {
        fontSize: 17,
        color: isDone ? 'var(--success)' : cur ? 'var(--accent)' : 'var(--text-muted)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13.5,
        color: cur ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
        fontWeight: cur ? 600 : 400
      }
    }, l.n, ". ", l.t));
  }))), /*#__PURE__*/React.createElement("article", {
    style: {
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 680,
      margin: '0 auto',
      padding: '34px 36px 56px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "outline"
  }, "Lesson 6 of 8"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-clock"
  }), " 20 min read")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 36,
      lineHeight: 1.12,
      color: 'var(--text-primary)',
      margin: '0 0 20px'
    }
  }, "Oversight & scalability"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.75,
      color: 'var(--text-secondary)',
      margin: '0 0 18px'
    }
  }, "As models get more capable, the hardest part of training them isn't compute \u2014 it's ", /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--text-primary)',
      fontStyle: 'italic'
    }
  }, "knowing whether they did the right thing"), ". When a system can write a proof you can't check, or a plan you can't fully trace, human oversight stops scaling. This lesson is about that gap and the ideas for closing it."), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 22,
      color: 'var(--text-primary)',
      margin: '28px 0 10px'
    }
  }, "The core tension"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.75,
      color: 'var(--text-secondary)',
      margin: '0 0 18px'
    }
  }, "Reward models are trained on human judgements. But human judgement is exactly the thing that fails to keep up. Scalable oversight asks: can we use AI to help humans supervise AI, without the helpers inheriting the same blind spots?"), /*#__PURE__*/React.createElement("pre", {
    style: {
      background: 'var(--bg-sunken)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: 18,
      fontFamily: 'var(--font-mono)',
      fontSize: 13.5,
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      overflow: 'auto',
      margin: '0 0 20px'
    }
  }, `# A debate-style oversight loop (sketch)
for round in range(N):
    claim   = model_a.argue(question)
    rebuttal = model_b.critique(claim)
    judge_signal = human.prefer(claim, rebuttal)
    reward.update(judge_signal)`), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.75,
      color: 'var(--text-secondary)',
      margin: '0 0 28px'
    }
  }, "None of these are solved. Each one trades one hard problem for a slightly different one \u2014 which is exactly why it's worth understanding where each approach breaks before you reach for it."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: 22,
      borderTop: '0.5px solid var(--border-subtle)'
    }
  }, done ? /*#__PURE__*/React.createElement(Badge, {
    variant: "success",
    dot: true
  }, "Marked complete") : /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    iconLeft: "check",
    onClick: () => setDone(true)
  }, "Mark complete"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: "arrow-right",
    onClick: onComplete,
    style: {
      marginLeft: 'auto'
    }
  }, "Next lesson")))));
}
Object.assign(window, {
  AppLesson
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Lesson.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Login.jsx
try { (() => {
/* Sign-in screen. Exposes AppLogin to window. */
const NS_LOGIN = window.XLabTracksDesignSystem_8f3d24;
function AppLogin({
  onSignIn
}) {
  const {
    Button,
    Input,
    Checkbox
  } = NS_LOGIN;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.05fr 1fr',
      minHeight: '100vh',
      background: 'var(--bg-base)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-warm)',
      borderRight: '0.5px solid var(--border-subtle)',
      padding: '48px 52px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 22,
      color: 'var(--text-primary)'
    }
  }, "XLab", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, " \xB7 "), "Tracks"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-quote",
    style: {
      fontSize: 30,
      color: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 28,
      lineHeight: 1.3,
      color: 'var(--text-primary)',
      margin: '14px 0 18px',
      maxWidth: '20ch'
    }
  }, "The clearest path I've found into actually doing this work."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, "Priya M. \u2014 research engineer, Foundations cohort 7"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSignIn();
    },
    style: {
      width: '100%',
      maxWidth: 340,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 28,
      color: 'var(--text-primary)',
      margin: '0 0 6px'
    }
  }, "Welcome back"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, "Pick up where you left off.")), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    icon: "mail",
    placeholder: "you@lab.org",
    defaultValue: "ada@lab.org"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Password",
    type: "password",
    icon: "lock",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    defaultValue: "password"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Keep me signed in",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 13,
      color: 'var(--accent-soft-text)',
      textDecoration: 'none'
    }
  }, "Forgot?")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    type: "submit",
    style: {
      width: '100%'
    }
  }, "Sign in"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      textAlign: 'center',
      margin: 0
    }
  }, "New here? ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onSignIn();
    },
    style: {
      color: 'var(--accent-soft-text)',
      textDecoration: 'none'
    }
  }, "Create an account")))));
}
Object.assign(window, {
  AppLogin
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Chrome.jsx
try { (() => {
/* Marketing site shared chrome: top nav + footer. Exposes to window. */
const NS_MKT = window.XLabTracksDesignSystem_8f3d24;
function MktNav({
  page,
  onNav
}) {
  const {
    Button
  } = NS_MKT;
  const link = (id, label) => React.createElement('a', {
    href: '#',
    onClick: e => {
      e.preventDefault();
      onNav(id);
    },
    style: {
      color: page === id ? 'var(--text-primary)' : 'var(--stone-200)',
      textDecoration: 'none',
      fontSize: 14,
      fontWeight: 500
    }
  }, label);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 40px',
      borderBottom: '0.5px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      background: 'color-mix(in oklch, var(--bg-base) 88%, transparent)',
      backdropFilter: 'blur(8px)',
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => onNav('home'),
    style: {
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 20,
      color: 'var(--text-primary)',
      letterSpacing: '-0.01em'
    }
  }, "XLab", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, " \xB7 "), "Tracks"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28
    }
  }, link('home', 'Tracks'), link('home', 'How it works'), link('pricing', 'Pricing'), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--stone-200)',
      textDecoration: 'none',
      fontSize: 14,
      fontWeight: 500
    }
  }, "For teams"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost"
  }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    iconRight: "arrow-right"
  }, "Browse tracks")));
}
function MktFooter() {
  const col = (title, items) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-secondary)',
      marginBottom: 4
    }
  }, title), items.map(t => /*#__PURE__*/React.createElement("a", {
    key: t,
    href: "#",
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, t)));
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
      gap: 28,
      padding: '40px 40px 48px',
      background: 'var(--bg-sunken)',
      borderTop: '0.5px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      color: 'var(--text-primary)'
    }
  }, "XLab", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, " \xB7 "), "Tracks"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.6,
      color: 'var(--text-muted)',
      maxWidth: '34ch',
      margin: '12px 0 0'
    }
  }, "Structured learning in AI safety. Built by researchers, paced for working people.")), col('Learn', ['All tracks', 'Cohorts', 'For teams', 'Syllabus']), col('About', ['Our approach', 'Mentors', 'Careers', 'Blog']), col('More', ['Help', 'Community', 'Privacy', 'Contact']));
}
Object.assign(window, {
  MktNav,
  MktFooter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Landing.jsx
try { (() => {
/* Marketing landing page. Composes DS components. Exposes MktLanding to window. */
const NS_LAND = window.XLabTracksDesignSystem_8f3d24;
const TRACKS = [{
  icon: 'route',
  title: 'Foundations of AI safety',
  desc: 'The core problem, the main threat models, and why this is hard. Start here.',
  lessons: 8,
  weeks: 4,
  level: 'Beginner',
  accent: 'var(--accent)'
}, {
  icon: 'eye',
  title: 'Interpretability',
  desc: 'Open the black box. Features, circuits, and probing what a model knows.',
  lessons: 10,
  weeks: 6,
  level: 'Intermediate',
  accent: 'var(--rose-400)'
}, {
  icon: 'shield-half',
  title: 'Evaluations & red-teaming',
  desc: 'Measure capability and risk. Build evals that actually catch failures.',
  lessons: 9,
  weeks: 5,
  level: 'Intermediate',
  accent: 'var(--slate-400)'
}, {
  icon: 'scale',
  title: 'Alignment theory',
  desc: 'Reward modelling, RLHF, scalable oversight, and where they break.',
  lessons: 12,
  weeks: 7,
  level: 'Advanced',
  accent: 'var(--accent)'
}, {
  icon: 'gavel',
  title: 'AI governance',
  desc: 'Policy, standards, and the levers outside the model. For non-engineers too.',
  lessons: 7,
  weeks: 4,
  level: 'Beginner',
  accent: 'var(--rose-400)'
}, {
  icon: 'building-bank',
  title: 'RLHF in practice',
  desc: 'Hands-on: train a reward model and fine-tune with human feedback.',
  lessons: 11,
  weeks: 6,
  level: 'Advanced',
  accent: 'var(--slate-400)'
}];
const STEPS = [{
  icon: 'book-2',
  t: 'Read the lesson',
  d: 'Short, dense, written by people who do the work. 20 minutes, no padding.',
  time: '~20 min'
}, {
  icon: 'tool',
  t: 'Build something',
  d: 'Every lesson ends with an exercise you run yourself — code or written.',
  time: '~45 min'
}, {
  icon: 'message-circle',
  t: 'Discuss in cohort',
  d: 'Bring it to your weekly group and a mentor. Then move to the next.',
  time: 'weekly'
}];
function MktLanding({
  onNav
}) {
  const {
    Button,
    Badge,
    Card,
    Tag,
    ProgressBar
  } = NS_LAND;
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '76px 40px 56px',
      maxWidth: 1080,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "New cohort starts July 14"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 56,
      lineHeight: 1.05,
      letterSpacing: '-0.01em',
      color: 'var(--text-primary)',
      margin: '20px 0 18px',
      maxWidth: '16ch'
    }
  }, "Learn to make AI go well."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: 1.7,
      color: 'var(--text-secondary)',
      maxWidth: '54ch',
      margin: '0 0 28px'
    }
  }, "Structured tracks in AI safety \u2014 alignment, interpretability, evaluations \u2014 built by researchers and paced for working people. No hype, no firehose. Just the path, one lesson at a time."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    iconLeft: "flame"
  }, "Browse tracks"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "See the syllabus")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 26,
      marginTop: 34,
      flexWrap: 'wrap'
    }
  }, [['6', 'tracks'], ['57', 'lessons'], ['1,400+', 'learners'], ['12', 'mentors']].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 26,
      color: 'var(--text-primary)'
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, l))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '8px 40px 64px',
      maxWidth: 1080,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--accent-soft-text)',
      margin: '0 0 6px'
    }
  }, "The catalogue"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 30,
      color: 'var(--text-primary)',
      margin: 0
    }
  }, "Pick a track. Start anywhere.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    selected: true
  }, "All"), /*#__PURE__*/React.createElement(Tag, null, "Beginner"), /*#__PURE__*/React.createElement(Tag, null, "Advanced"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16
    }
  }, TRACKS.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.title,
    interactive: true,
    as: "a",
    href: "#",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${t.icon}`,
    style: {
      fontSize: 26,
      color: t.accent
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 19,
      color: 'var(--text-primary)',
      margin: '0 0 6px'
    }
  }, t.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, t.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 'auto',
      paddingTop: 6,
      fontSize: 12.5,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-book"
  }), " ", t.lessons, " lessons"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-clock"
  }), " ", t.weeks, " weeks"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      color: 'var(--accent-soft-text)'
    }
  }, t.level)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-warm)',
      padding: '56px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1080,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--accent-soft-text)',
      margin: '0 0 6px'
    }
  }, "How it works"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 30,
      color: 'var(--text-primary)',
      margin: '0 0 30px'
    }
  }, "Read, build, discuss. Then again."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 22
    }
  }, STEPS.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.t
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${s.icon}`,
    style: {
      fontSize: 22,
      color: 'var(--accent)'
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)'
    }
  }, s.time)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      fontWeight: 500,
      color: 'var(--text-primary)',
      margin: '0 0 6px'
    }
  }, i + 1, ". ", s.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.65,
      color: 'var(--text-secondary)',
      margin: 0,
      maxWidth: '34ch'
    }
  }, s.d)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '64px 40px',
      maxWidth: 1080,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "default",
    pad: "lg",
    style: {
      textAlign: 'center',
      padding: '44px 32px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 30,
      color: 'var(--text-primary)',
      margin: '0 0 10px'
    }
  }, "Learn at your own pace"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.7,
      color: 'var(--text-secondary)',
      maxWidth: '46ch',
      margin: '0 auto 24px'
    }
  }, "Audit any track free, forever. Join a cohort for live discussion, mentor feedback, and a certificate \u2014 $29 a month, cancel whenever."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Start for free"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "lg",
    onClick: () => onNav('pricing')
  }, "Compare plans")))));
}
Object.assign(window, {
  MktLanding
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Landing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Pricing.jsx
try { (() => {
/* Marketing pricing page. Exposes MktPricing to window. */
const NS_PRICE = window.XLabTracksDesignSystem_8f3d24;
const PLANS = [{
  name: 'Audit',
  price: '$0',
  unit: 'forever',
  desc: 'Read every lesson at your own pace.',
  cta: 'Start auditing',
  variant: 'secondary',
  featured: false,
  features: ['All 6 tracks, all lessons', 'Exercises & reading lists', 'Community forum', 'No certificate']
}, {
  name: 'Member',
  price: '$29',
  unit: 'per month',
  desc: 'Cohorts, feedback, and a certificate.',
  cta: 'Join a cohort',
  variant: 'primary',
  featured: true,
  features: ['Everything in Audit', 'Weekly live cohort', 'Mentor feedback on work', 'Certificate of completion', 'Cancel anytime']
}, {
  name: 'Teams',
  price: 'Custom',
  unit: 'per seat',
  desc: 'Train your org on AI safety together.',
  cta: 'Talk to us',
  variant: 'secondary',
  featured: false,
  features: ['Everything in Member', 'Private cohorts', 'Progress dashboard', 'Invoicing & SSO', 'Dedicated mentor']
}];
function MktPricing() {
  const {
    Button,
    Badge,
    Card
  } = NS_PRICE;
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1080,
      margin: '0 auto',
      padding: '64px 40px 72px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "Pricing"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 44,
      lineHeight: 1.08,
      color: 'var(--text-primary)',
      margin: '18px 0 12px'
    }
  }, "Free to learn. Pay to go deeper."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.7,
      color: 'var(--text-secondary)',
      maxWidth: '46ch',
      margin: '0 auto'
    }
  }, "Every lesson is free to read. A membership adds the parts that actually change how you work \u2014 people, feedback, and accountability.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 18,
      alignItems: 'start'
    }
  }, PLANS.map(p => /*#__PURE__*/React.createElement(Card, {
    key: p.name,
    pad: "lg",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      border: p.featured ? '0.5px solid var(--accent)' : '0.5px solid var(--border-default)',
      background: p.featured ? 'var(--surface-warm)' : 'var(--surface-card)',
      position: 'relative'
    }
  }, p.featured && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -11,
      left: 24
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "accent"
  }, "Most popular")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-primary)',
      margin: '0 0 4px'
    }
  }, p.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, p.desc)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 40,
      color: 'var(--text-primary)'
    }
  }, p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, p.unit)), /*#__PURE__*/React.createElement(Button, {
    variant: p.variant,
    style: {
      width: '100%'
    }
  }, p.cta), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 4
    }
  }, p.features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 13.5,
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-check",
    style: {
      fontSize: 16,
      color: 'var(--accent)'
    },
    "aria-hidden": "true"
  }), f)))))));
}
Object.assign(window, {
  MktPricing
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Pricing.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Tag = __ds_scope.Tag;

})();
