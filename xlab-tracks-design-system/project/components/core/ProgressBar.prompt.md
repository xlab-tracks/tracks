One-line: Course/lesson completion bar — ember fill that turns sage-green when complete.

```jsx
<ProgressBar value={3} max={6} label="Intro to alignment" />
<ProgressBar value={100} size="sm" showValue={false} />
```

Notes: pass `value`/`max` in real units (lessons done / total). Hits success color automatically at 100%. Use size="sm" inside dense cards.
