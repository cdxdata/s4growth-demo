# Steps4Growth Reporting Command Center

A standalone, synthetic-data proof-of-value for the NC A&T Steps4Growth reporting workflow.

The is a Vite + React TypeScript app. Screens follow the **Summary pattern**: each view is a thin render function, and a matching `use*` hook returns the summary object (data, derived state, and actions) that the view needs.

- **Vite** builds and serves the React app
- **Redux Toolkit** persists the synthetic monthly submissions, status changes, and notification outbox
- **TanStack Query** supports the remaining synthetic participant and review views

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

```bash
npm run build
npm run preview
npm test
```

## To deploy to Github Pages

```bash
npm run build
cp dist/index.html dist/404.html
npx gh-pages -d dist
```

## Demo story

Use `manager@tester.com` for the project-manager view, `tp@tester.com` for Piedmont, or `admin@tester.com` for the directory. All participant details are synthetic.

Email delivery and EDA transmission are intentionally simulated behind adapter interfaces in `src/adapters/`. Replacing either demo adapter with a live implementation does not require rebuilding the intake, tracker, or report assembler. Demo state persists in `localStorage`, so the vertical slice survives a refresh.

## Project layout

```text
src/
  api/                 TanStack Query-facing mock API
  adapters/            Swappable simulated notification and EDA export boundaries
  app/                 Store, typed hooks, providers
  components/          Shared layout and UI
  config/              Schema-driven intake configuration
  constants/           Navigation and cycle labels
  features/*/          One folder per screen: Page + use* summary hook
  lib/                 Quarterly aggregation and reporting helpers
  store/               Redux Toolkit slices
  types/               Shared domain types
```
