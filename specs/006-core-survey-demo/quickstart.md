# Quickstart: Core Survey Demo

Requirements: Node.js 22 and pnpm 10.

```bash
pnpm install
pnpm --filter @flowgraph/survey-demo dev
```

Open the local URL printed by Vite. The app needs no account, backend, or external
service.

Run feature verification:

```bash
pnpm --filter @flowgraph/survey-demo test
pnpm --filter @flowgraph/survey-demo build
pnpm test:demo-browser
```

Manual acceptance:

1. Complete each of the sleep, stress, and life-change routes.
2. From the shared adaptation section, complete the specific-request,
   spacious-capacity, and focused-capacity routes.
3. Enter one route, go back, choose another, finish, then replay the events and confirm
   abandoned answers are not active.
4. Refresh midway and confirm page, answers, route, and progress are restored.
5. Submit and confirm the response cannot be edited or submitted twice.
6. Start a new demo, cancel once, then confirm replacement.
7. Repeat at 360 px and desktop widths using keyboard only.
