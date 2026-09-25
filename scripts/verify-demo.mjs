import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  root,
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const [{ assembleQuarter }, periods, submissions, eda, notifications] = await Promise.all([
    vite.ssrLoadModule("/src/lib/quarterAssembler.ts"),
    vite.ssrLoadModule("/src/constants/periods.ts"),
    vite.ssrLoadModule("/src/store/submissionsSlice.ts"),
    vite.ssrLoadModule("/src/adapters/edaSubmission.ts"),
    vite.ssrLoadModule("/src/adapters/notifications.ts"),
  ]);

  const initial = submissions.submissionsReducer(undefined, { type: "verification/init" });
  const records = initial.byProvider["1"];
  const quarter = periods.getPeriodById("2026-q3");
  const draft = assembleQuarter(quarter, records);

  assert.equal(draft.sources.length, 3, "The Q3 draft must cite July, August, and September.");
  assert.ok(draft.enrolled > 0, "Quarterly enrollment must come from monthly EDA records.");
  assert.ok(draft.completions > 0, "Quarterly completions must come from monthly EDA records.");
  assert.ok(draft.placements > 0, "Quarterly placements must come from monthly EDA records.");
  assert.equal(draft.fromIntake, true, "Quarterly narratives must come from structured intake.");

  const edited = submissions.submissionsReducer(
    initial,
    submissions.updateTechnical({
      providerId: 1,
      periodId: "2026-09",
      patch: {
        plans: [{
          plan: "Assign an employer liaison to every September completer.",
          potentialGain: "Increase placement follow-up coverage.",
        }],
      },
    }),
  );
  const submitted = submissions.submissionsReducer(
    edited,
    submissions.submitMonthlyPackage({ providerId: 1, periodId: "2026-09" }),
  );
  const completed = submissions.submissionsReducer(
    submitted,
    submissions.setProviderPeriodStatus({
      providerId: 1,
      periodId: "2026-09",
      status: "Complete",
    }),
  );
  assert.equal(completed.byProvider["1"]["2026-09"].status, "Approved");
  assert.equal(completed.providerStatus["2026-09"]["1"].status, "Complete");
  const refreshedDraft = assembleQuarter(quarter, completed.byProvider["1"]);
  assert.ok(refreshedDraft.plan.includes("employer liaison"));

  const input = {
    quarterLabel: "Q3 2026",
    providerName: "Piedmont Community College",
    records,
    draft,
  };
  const rows = eda.buildEdaSummaryRows(input);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tp_name, input.providerName);
  assert.equal(rows[0].part_enroll, draft.enrolled);
  assert.equal(rows[0].part_comp, draft.completions);

  const workbook = eda.buildWorkbookBlob(rows, [["Achievements", draft.achievements]]);
  const workbookBytes = new Uint8Array(await workbook.arrayBuffer());
  const workbookText = new TextDecoder().decode(workbookBytes);
  const endOffset = workbookBytes.length - 22;
  const endRecord = new DataView(workbookBytes.buffer, endOffset, 22);
  assert.deepEqual([...workbookBytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.equal(endRecord.getUint32(0, true), 0x06054b50, "Workbook must end with a valid ZIP directory.");
  assert.equal(endRecord.getUint16(10, true), 6, "Workbook must contain all six XLSX package files.");
  assert.equal(
    endRecord.getUint32(12, true) + endRecord.getUint32(16, true) + 22,
    workbookBytes.length,
    "The XLSX central directory must cover the complete workbook.",
  );
  assert.ok(workbookText.includes("Summary Sheet"));
  assert.ok(workbookText.includes("PPR Draft"));
  assert.ok(workbookText.includes("tp_name"));

  const notification = await notifications.simulatedNotificationAdapter.send({
    providerId: 1,
    periodId: "2026-09",
    recipients: ["demo@example.com"],
    subject: "September report reminder",
    body: "Please complete the missing action plan.",
    status: "Missing/flagged",
  });
  assert.ok(notification.id.startsWith("sim-"));
  assert.equal(notification.recipients[0], "demo@example.com");
  assert.equal(notification.status, "Missing/flagged");
  const withOutbox = submissions.submissionsReducer(completed, submissions.recordMail(notification));
  assert.equal(withOutbox.mail[0].id, notification.id);
  assert.equal(withOutbox.mail.length, 1);

  console.log("Demo scope verification passed: aggregation, status, XLSX, and notification adapter.");
} finally {
  await vite.close();
}
