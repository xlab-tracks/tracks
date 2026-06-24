One-line: A checkbox with ember fill + check glyph when selected — for lesson completion, consent, multi-select filters.

```jsx
<Checkbox label="Mark lesson complete" defaultChecked />
<Checkbox label="Email me weekly progress" />
```

Notes: controlled via `checked`/`onChange` or uncontrolled via `defaultChecked`. Use Switch instead for instant on/off settings.
