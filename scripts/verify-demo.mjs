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
  const [{ assembleQuarter }, periods, submissions, eda, notifications, reportMod, reviewModel] = await Promise.all([
    vite.ssrLoadModule("/src/lib/quarterAssembler.ts"),
    vite.ssrLoadModule("/src/constants/periods.ts"),
    vite.ssrLoadModule("/src/store/submissionsSlice.ts"),
    vite.ssrLoadModule("/src/adapters/edaSubmission.ts"),
    vite.ssrLoadModule("/src/adapters/notifications.ts"),
    vite.ssrLoadModule("/src/lib/quarterReport.ts"),
    vite.ssrLoadModule("/src/lib/reviewModel.ts"),
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

  const report = reportMod.buildQuarterReport(quarter, initial.byProvider, "NC A&T Project Office");
  assert.equal(report.pages.length, 12, "The quarterly draft must be a 12-page report.");
  assert.deepEqual(
    report.pages.map((item) => item.title),
    [
      "Program Progress Report",
      "Training Provider",
      "Participant Database",
      "Institutional Information",
      "Admissions",
      "Training Completion",
      "Reason for non-completion",
      "Employment Type",
      "Earn and Learn",
      "Salaries of participants",
      "Employment Status (6 months)",
      "Technical report",
    ],
  );
  const admissions = report.pages[4].blocks[0].fields;
  const enrolledField = admissions.find((field) => String(field.label).includes("ENROLLED"));
  const recruitedField = admissions.find((field) => String(field.label).includes("RECRUITED"));
  assert.ok(draft.enrolled > 0, "Piedmont quarterly enrollment must come from monthly EDA records.");
  assert.ok(Number(enrolledField?.value) >= draft.enrolled, "Quarterly admissions must include every provider packet.");
  assert.ok(Number(recruitedField?.value) > 0, "Admissions counts must sum the three monthly packets.");
  assert.ok(report.pages[11].narrative.includes("Enrollment") || report.pages[11].narrative.includes("Achievements"));

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

  const sheets = eda.buildEdaWorkbookSheets(records);
  assert.equal(sheets.length, 10, "Workbook must include one sheet per EDA Survey form.");
  assert.deepEqual(
    sheets.map((sheet) => sheet.name),
    [
      "Training Provider",
      "Participant Database",
      "Institutional Information",
      "Admissions",
      "Training Completion",
      "Reason for non-completion",
      "Employment Type",
      "Earn and Learn",
      "Salaries of participants",
      "Employment Status (6 months)",
    ],
  );
  const programGroup = sheets[0].groups.find((group) => group.label === "Training Program");
  assert.ok(programGroup?.children?.includes("Training Program 1"));
  assert.ok(programGroup?.children?.includes("Training Program 2"));
  const addressGroup = sheets[1].groups.find((group) => group.label === "Address of Residence");
  assert.deepEqual(addressGroup?.children, ["Street", "Street (apt, etc)", "City", "State", "Zip"]);
  const hoursGroup = sheets[2].groups.find((group) => group.label === "Program Hours");
  assert.ok(hoursGroup?.children?.includes("Full time program"));
  const reasonGroup = sheets[5].groups.find((group) => group.label === "What was the reason for non-completion?");
  assert.ok(reasonGroup?.children?.includes("Other"));
  assert.equal(sheets[0].rows[0][0], "Piedmont-Triad Advanced Manufacturing Partnership");
  assert.equal(sheets[0].rows[0][1], "Piedmont Community College");

  const workbook = eda.buildWorkbookBlob(sheets);
  const workbookBytes = new Uint8Array(await workbook.arrayBuffer());
  const workbookText = new TextDecoder().decode(workbookBytes);
  const endOffset = workbookBytes.length - 22;
  const endRecord = new DataView(workbookBytes.buffer, endOffset, 22);
  assert.deepEqual([...workbookBytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.equal(endRecord.getUint32(0, true), 0x06054b50, "Workbook must end with a valid ZIP directory.");
  assert.equal(endRecord.getUint16(10, true), 14, "Workbook must contain the XLSX package plus 10 worksheets.");
  assert.equal(
    endRecord.getUint32(12, true) + endRecord.getUint32(16, true) + 22,
    workbookBytes.length,
    "The XLSX central directory must cover the complete workbook.",
  );
  assert.ok(workbookText.includes("Training Provider"));
  assert.ok(workbookText.includes("Sectoral Partnership"));
  assert.ok(workbookText.includes("Address of Residence"));
  assert.ok(workbookText.includes("What was the reason for non-completion?"));
  assert.ok(workbookText.includes("Employment Status (6 months)"));

  const statusEmail = reviewModel.buildStatusEmail({
    providerName: "Piedmont Community College",
    periodId: "2026-09",
    status: "Complete",
    record: records["2026-09"],
  });
  assert.equal(statusEmail.subject, "Complete: September Steps4Growth report");
  assert.ok(statusEmail.body.includes("Your September submission status is marked Complete."));
  assert.ok(statusEmail.body.includes("Current due date:"));
  assert.ok(statusEmail.body.includes("Status:"));
  const withStatusMail = submissions.submissionsReducer(
    completed,
    submissions.recordMail({
      id: "mail-status-test",
      periodId: "2026-09",
      providerId: 1,
      recipients: ["tp@tester.com"],
      subject: statusEmail.subject,
      body: statusEmail.body,
      sentOn: "2026-09-21",
      status: "Complete",
    }),
  );
  assert.equal(withStatusMail.mail[0].subject, statusEmail.subject);
  assert.ok(withStatusMail.mail[0].body.includes("Your September submission status is marked Complete."));

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
  assert.ok(withOutbox.mail.length >= 1);

  console.log("Demo scope verification passed: aggregation, status, XLSX, and notification adapter.");
} finally {
  await vite.close();
}
