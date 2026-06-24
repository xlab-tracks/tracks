One-line: The primary action control — ember-filled `primary`, rose-outline `secondary`, quiet `ghost`, and `danger`; sizes sm/md/lg; optional Tabler icons.

```jsx
<Button variant="primary" iconLeft="flame">Start the track</Button>
<Button variant="secondary">Take a tour</Button>
<Button variant="ghost" size="sm" iconRight="arrow-right">Next lesson</Button>
```

Notes:
- `variant`: `primary` (ember fill, dark text) for the main action; `secondary` (rose outline) for an alternative; `ghost` for tertiary; `danger` for destructive.
- `iconLeft` / `iconRight` take a Tabler icon name without the `ti-` prefix (the page must load Tabler Icons).
- Use `as="a"` with `href` for link-styled buttons. One primary action per view.
