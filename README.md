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
2. Call out the three projected impact measures: reporting delay, first-attempt completeness, and PPR preparation time.
3. Open **Participant review** and import the synthetic EDA Survey Tool records.
4. Open **Monthly intake**, complete the two required narrative fields, and submit.
5. Show the updated review queue and tracker state.
6. Open **Nudges**, log a simulated reminder, and show the persistent notification outbox.
7. Open **Quarterly draft** to show the submitted narratives and participant rollups assembled into one traceable draft.
8. Generate the coded EDA summary CSV and show the no-transmission confirmation.

The primary UI is written in React and uses synthetic data. It includes a small local fallback so the demo remains viewable if external browser scripts are unavailable. Email delivery and EDA submission are intentionally simulated.

Use **Reset demo data** at the bottom of the navigation before a rehearsal or presentation.
