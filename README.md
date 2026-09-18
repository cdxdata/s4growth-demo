# Steps4Growth Reporting Command Center

A standalone, synthetic-data proof-of-value for the NC A&T Steps4Growth reporting workflow.

## Run locally

From the parent directory:

```bash
python3 -m http.server 4173 --directory steps4growth-demo
```

Open `http://localhost:4173`.

## Demo story

1. Start at the reporting dashboard and open Piedmont Community College.
2. Open **Monthly intake**, complete the two required narrative fields, and submit.
3. Show the updated review queue and resolved completion-total flag.
4. Open **Nudges** and log a simulated reminder.
5. Open **Quarterly draft** to show the structured update available in the reporting draft.

The primary UI is written in React and uses synthetic data. It includes a small local fallback so the demo remains viewable if external browser scripts are unavailable. Email delivery and EDA submission are intentionally simulated.
