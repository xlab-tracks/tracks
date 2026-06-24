# Learner app — UI kit

High-fidelity recreation of the XLab Tracks signed-in learning experience.

## Screens / flow
Open `index.html` and click through:
1. **Sign in** (`Login.jsx`) — split brand panel + form. Any submit signs in.
2. **Dashboard** (`Dashboard.jsx`) — continue-learning banner, your tracks with progress, this-week cohort activity.
3. **Lesson reader** (`Lesson.jsx`) — lesson rail with completion state, reading column with a code block, "Mark complete" → "Next lesson".

`AppShell.jsx` provides the persistent left sidebar + top bar (search, streak, notifications).

## Composition notes
- Built from DS primitives: `Avatar`, `Button`, `Badge`, `Card`, `Tabs`, `Input`, `Checkbox`, `ProgressBar`.
- `ProgressBar` is the spine of the app — used on dashboard cards and the lesson rail; turns sage-green at 100%.
- Sidebar uses `--bg-sunken`; content uses `--bg-base`. Reading column caps at ~680px for measure.
