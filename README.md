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

1. Start at the reporting dashboard and open Piedmont Community College.
2. Open **Monthly Submissions**, complete the missing September action plan, and submit the package.
3. Show the tracker change to complete; the manager and provider views read the same persisted record.
4. Open **Nudges**, send a simulated reminder, and show its persistent outbox entry.
5. Open **Quarterly draft** to show metrics and narratives assembled from the July–September monthly records.
6. Generate and download the EDA workbook. Its coded **Summary Sheet** and **PPR Draft** are generated from the same records, while the confirmation makes clear that nothing was transmitted.

Use `manager@tester.com` for the program-manager view or `tp@tester.com` for the training-provider view. All participant details are synthetic.

Email delivery and EDA transmission are intentionally simulated behind adapter interfaces in `src/adapters/`. Replacing either demo adapter with a live implementation does not require rebuilding the intake, tracker, or report assembler. Demo state persists in `localStorage`, so the vertical slice survives a refresh.

## Project layout

```
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
