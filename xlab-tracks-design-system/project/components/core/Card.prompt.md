One-line: The base content surface — stone fill, hairline border, 14px radius; use `interactive` for clickable track/lesson cards.

```jsx
<Card>
  <i className="ti ti-flame" style={{fontSize:24,color:'var(--accent)'}} />
  <h3>Intro to AI alignment</h3>
  <p>Six lessons on the core problem.</p>
</Card>

<Card interactive as="a" href="#">Open track →</Card>
```

Notes:
- `variant="warm"` for ember-tinted feature bands; `sunken` for code/well areas.
- Don't stack heavy shadows; the border carries the elevation. Compose with Badge, ProgressBar, Button inside.
