One-line: A labelled text field with sunken well background, optional leading icon, hint and error states.

```jsx
<Input label="Email" type="email" icon="mail" placeholder="you@lab.org" />
<Input label="Cohort code" hint="Find this in your invite." />
<Input label="Email" error="That address isn't recognised." />
```

Notes:
- Focus shows the ember ring. Pass `error` to flag invalid state (overrides `hint`). All native input attrs pass through.
