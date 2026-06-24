One-line: Underlined navigation tabs with an ember active indicator — for switching views (Overview / Lessons / Discussion).

```jsx
<Tabs
  items={[
    {id:'overview', label:'Overview', icon:'book'},
    {id:'lessons', label:'Lessons'},
    {id:'discuss', label:'Discussion'},
  ]}
  defaultValue="overview"
  onChange={(id)=>setTab(id)}
/>
```

Notes: controlled via `value`/`onChange` or uncontrolled via `defaultValue`. You render the panel content yourself based on the active id.
