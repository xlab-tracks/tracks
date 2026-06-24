One-line: Pill topic/filter tag — outline by default, ember fill when selected; optional removable "x".

```jsx
<Tag>Alignment</Tag>
<Tag selected onClick={()=>toggle('rl')}>Reinforcement learning</Tag>
<Tag onRemove={()=>drop('nlp')}>NLP</Tag>
```

Notes: use for course topics, filter chips, and applied-filter rows. For status/metadata that isn't interactive, use Badge.
