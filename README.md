# Steps4Growth Reporting Command Center

A standalone, synthetic-data proof-of-value for the NC A&T Steps4Growth reporting workflow.

The is a Vite + React TypeScript app. Screens follow the **Summary pattern**: each view is a thin render function, and a matching `use*` hook returns the summary object (data, derived state, and actions) that the view needs.

- **Vite** builds and serves the React app
- **Redux Toolkit** holds client/workspace state (reporting cycle, intake draft, toasts)
- **TanStack Query** fetches and mutates the synthetic reporting API

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

```bash
npm run build
npm run preview
```

## Demo story

1. Start at the reporting dashboard and open Piedmont Community College.
2. Open **Monthly Submissions**, complete the two required narrative fields, and submit.
3. Show the updated review queue and resolved completion-total flag.
4. Open **Nudges** and log a simulated reminder.
5. Open **Quarterly draft** to show the structured update available in the reporting draft.

The primary UI uses synthetic data from `src/api/mockDb.ts`. Email delivery and EDA submission are intentionally simulated. The workbook-import flag and nudge log persist in `localStorage` so those demo steps survive a refresh.

## Project layout

```
src/
  api/                 TanStack Query-facing mock API
  app/                 Store, typed hooks, providers
  components/          Shared layout and UI
  constants/           Navigation and cycle labels
  features/*/          One folder per screen: Page + use* summary hook
  store/               Redux Toolkit slices
  types/               Shared domain types
```
