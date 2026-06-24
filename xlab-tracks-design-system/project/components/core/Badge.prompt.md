One-line: A small label for status, category, or metadata — warm tinted `accent` chip by default, plus neutral/success/warning/danger/outline.

```jsx
<Badge>Now enrolling</Badge>
<Badge variant="success" dot>Completed</Badge>
<Badge variant="outline" icon="clock">4 weeks</Badge>
```

Notes:
- `accent` matches the brand "Now open / Now enrolling" chip (stone tint, rose text).
- Use `dot` for live/status states; `icon` for a leading Tabler glyph. Keep labels to 1–3 words, sentence case.
