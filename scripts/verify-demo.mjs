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
  const [{ assembleQuarter, assembleQuarterScope, recordsForWorkbook }, periods, submissions, eda, notifications, reportMod, reviewModel, scope] = await Promise.all([
    vite.ssrLoadModule("/src/lib/quarterAssembler.ts"),
    vite.ssrLoadModule("/src/constants/periods.ts"),
    vite.ssrLoadModule("/src/store/submissionsSlice.ts"),
    vite.ssrLoadModule("/src/adapters/edaSubmission.ts"),
    vite.ssrLoadModule("/src/adapters/notifications.ts"),
    vite.ssrLoadModule("/src/lib/quarterReport.ts"),
    vite.ssrLoadModule("/src/lib/reviewModel.ts"),
    vite.ssrLoadModule("/src/lib/providerScope.ts"),
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

  assert.equal(scope.resolveProviderId({ role: "training-provider", entityId: "tp-3", organizationName: "Piedmont Community College" }), 3);
  assert.equal(scope.resolveProviderId({ role: "training-provider", entityId: "tp-x", organizationName: "Central Carolina Skills" }), 3);
  assert.equal(scope.resolveProviderId({ role: "project-manager", entityId: "pm-1", organizationName: "NC A&T Project Office" }), null);
  assert.equal(scope.resolveProviderId(null), null);
  assert.equal(scope.parseProviderRouteId(undefined), null);
  assert.equal(scope.parseProviderRouteId("1"), 1);
  assert.equal(scope.parseProviderRouteId("0"), null);
  assert.equal(submissions.getPeriodSubmission(initial, "2026-09").eda.trainingProvider, "");
  assert.equal(submissions.getPeriodSubmission(initial, "2026-09", null).eda.trainingProvider, "");
  assert.equal(submissions.getPeriodSubmission(initial, "2026-09", 1).eda.trainingProvider, "Piedmont Community College");
  const skippedWrite = submissions.submissionsReducer(
    initial,
    submissions.updateTechnical({
      periodId: "2026-09",
      patch: { challenges: [{ keyword: "Leak", detail: "Should not land on Piedmont" }] },
    }),
  );
  assert.deepEqual(
    skippedWrite.byProvider["1"]["2026-09"].technical.challenges,
    initial.byProvider["1"]["2026-09"].technical.challenges,
  );
  const networkDraft = assembleQuarterScope(quarter, initial.byProvider, null);
  assert.ok(networkDraft.enrolled > draft.enrolled, "PM quarterly totals must include every provider, not Piedmont only.");
  assert.equal(assembleQuarterScope(quarter, initial.byProvider, 3).enrolled, assembleQuarter(quarter, initial.byProvider["3"]).enrolled);
  assert.ok(Object.keys(recordsForWorkbook(initial.byProvider, null)).length > Object.keys(initial.byProvider["1"]).length);

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

  const [
    cardStatusesMod,
    dashboardPeriod,
    dashboardStatus,
    demoStatuses,
    docs,
    tech,
    edaRecords,
    directory,
    demoReset,
    persist,
    demoSeed,
    authTypes,
  ] = await Promise.all([
    vite.ssrLoadModule("/src/lib/cardStatuses.ts"),
    vite.ssrLoadModule("/src/api/dashboardByPeriod.ts"),
    vite.ssrLoadModule("/src/lib/dashboardStatus.ts"),
    vite.ssrLoadModule("/src/lib/demoStatuses.ts"),
    vite.ssrLoadModule("/src/lib/submissionDocuments.ts"),
    vite.ssrLoadModule("/src/lib/technicalReport.ts"),
    vite.ssrLoadModule("/src/lib/edaProgramRecords.ts"),
    vite.ssrLoadModule("/src/api/directoryDb.ts"),
    vite.ssrLoadModule("/src/lib/demoReset.ts"),
    vite.ssrLoadModule("/src/lib/submissionsPersist.ts"),
    vite.ssrLoadModule("/src/lib/demoSeed.ts"),
    vite.ssrLoadModule("/src/types/auth.ts"),
  ]);

  assert.deepEqual(cardStatusesMod.cardStatuses("Submitted", "Missing/flagged"), {
    status: "Action Needed",
    reviewStatus: "Missing/flagged",
  });
  assert.deepEqual(cardStatusesMod.cardStatuses("Submitted", "Complete"), {
    status: "Approved",
    reviewStatus: null,
  });
  assert.deepEqual(cardStatusesMod.cardStatuses("Submitted", "In review"), {
    status: "Submitted",
    reviewStatus: "In review",
  });
  assert.deepEqual(cardStatusesMod.cardStatuses("Submitted", "Awaiting review"), {
    status: "Submitted",
    reviewStatus: "Awaiting review",
  });
  assert.deepEqual(cardStatusesMod.cardStatuses("Action Needed", "Not started"), {
    status: "Action Needed",
    reviewStatus: null,
  });

  const septemberRows = dashboardPeriod.providersForPeriod("2026-09");
  for (const row of septemberRows) {
    assert.equal(
      row.submissionStatus,
      demoStatuses.demoStatusForPeriod("2026-09", row.id),
      `Dashboard September status for provider ${row.id} must match the seed map.`,
    );
  }
  const overlaid = dashboardStatus.overlayStoredStatus({
    submissionStatus: septemberRows.find((row) => row.id === 3).submissionStatus,
    completedOn: null,
    statusChangedOn: null,
    stored: { status: "Awaiting review", completedOn: null, statusChangedOn: "2026-09-21" },
  });
  assert.equal(overlaid.submissionStatus, "Awaiting review");
  const seedCounts = dashboardStatus.dashboardStatusCounts(
    septemberRows.map((row) => row.submissionStatus),
  );
  const liveCounts = dashboardStatus.dashboardStatusCounts(
    septemberRows.map((row) =>
      row.id === 3 ? overlaid.submissionStatus : row.submissionStatus,
    ),
  );
  assert.equal(seedCounts.completeCount, 5);
  assert.equal(seedCounts.needAttentionCount, 5);
  assert.equal(seedCounts.followUpCount, 5);
  assert.equal(liveCounts.notStarted, seedCounts.notStarted - 1);
  assert.equal(liveCounts.awaitingReview, seedCounts.awaitingReview + 1);

  const blankTechnical = tech.defaultIntakeDraft();
  assert.equal(docs.technicalFillState(blankTechnical), "blank");
  assert.equal(docs.isTechnicalValid(blankTechnical), true);
  assert.equal(docs.canSubmitMonthlyPackage(initial.byProvider["3"]["2026-09"]), false);

  const incompleteCompletion = {
    ...edaRecords.emptyCompletion("Piedmont Community College", "IT Support"),
    completed: "",
    completedOnTime: "",
    completedNotContinuous: "",
  };
  assert.equal(docs.isCompletionProgramValid(incompleteCompletion), false);
  assert.equal(docs.isCompletionProgramValid({ ...incompleteCompletion, skipNoCompletions: true }), true);
  const incompleteNonCompletion = {
    ...edaRecords.emptyNonCompletion("Piedmont Community College", "IT Support"),
    reasons: { ...edaRecords.emptyReasons(), technicalRequirements: "" },
  };
  assert.equal(docs.isNonCompletionProgramValid(incompleteNonCompletion), false);
  assert.equal(docs.isNonCompletionProgramValid({ ...incompleteNonCompletion, skipReasons: true }), true);
  assert.equal(
    docs.isTrainingProviderSegmentValid({ sectoralPartnership: "", trainingProvider: "", trainingPrograms: [""] }),
    false,
  );
  assert.equal(
    docs.isTrainingProviderSegmentValid({
      sectoralPartnership: "Capital Area Healthcare Partnership",
      trainingProvider: "Central Carolina Skills",
      trainingPrograms: ["IT Support"],
    }),
    true,
  );

  const filledEda = initial.byProvider["4"]["2026-09"].eda;
  const firstAttempt = submissions.submissionsReducer(
    initial,
    submissions.updateEda({ providerId: 3, periodId: "2026-09", patch: filledEda }),
  );
  const firstRecord = submissions.getPeriodSubmission(firstAttempt, "2026-09", 3);
  assert.equal(docs.technicalFillState(firstRecord.technical), "blank");
  assert.equal(docs.canSubmitMonthlyPackage(firstRecord), true);
  const firstSubmitted = submissions.submissionsReducer(
    firstAttempt,
    submissions.submitMonthlyPackage({ providerId: 3, periodId: "2026-09" }),
  );
  const firstQueued = submissions.submissionsReducer(
    firstSubmitted,
    submissions.setProviderPeriodStatus({
      providerId: 3,
      periodId: "2026-09",
      status: "Awaiting review",
    }),
  );
  assert.equal(firstQueued.byProvider["3"]["2026-09"].status, "Submitted");
  assert.equal(firstQueued.providerStatus["2026-09"]["3"].status, "Awaiting review");

  const flagged = initial.byProvider["1"]["2026-09"];
  assert.equal(flagged.review["technical-report"].fieldMarks["technical.challenges"], "bad");
  assert.equal(flagged.review["eda-survey"].sections.admissions.fieldMarks["eda.admissions.0"], "bad");
  const unmarkedTechnical = submissions.submissionsReducer(
    initial,
    submissions.updateTechnical({
      providerId: 1,
      periodId: "2026-09",
      patch: {
        challenges: [{ keyword: "Enrollment", detail: "Evening sections recovered after the plant returned to first shift." }],
      },
    }),
  );
  const afterTechnical = unmarkedTechnical.byProvider["1"]["2026-09"];
  assert.ok(reviewModel.changedReviewFieldIds(afterTechnical).includes("technical.challenges"));
  assert.equal(afterTechnical.review["technical-report"].fieldMarks["technical.challenges"], undefined);
  assert.equal(afterTechnical.review["technical-report"].fieldMarks["technical.plans"], "good");
  const unmarkedEda = reviewModel.unmarkChangedFields(afterTechnical.review, ["eda.admissions.0"]);
  assert.equal(unmarkedEda["eda-survey"].sections.admissions.fieldMarks["eda.admissions.0"], undefined);

  directory.directoryDb.resetToSeed();
  const atCapacity = directory.directoryDb.addOrgContact("tp-12", "Extra Person", "extra.person@s4g.test");
  assert.equal("error" in atCapacity, true);
  assert.match(atCapacity.error, new RegExp(String(authTypes.MAX_ORG_CONTACTS)));
  const added = directory.directoryDb.addOrgContact("tp-2", "Second User", "second.user@s4g.test");
  assert.equal("error" in added, false);
  directory.directoryDb.resetToSeed();
  assert.equal(directory.directoryDb.getEntity("tp-2").orgContacts.length, 1);

  const mem = {
    data: Object.create(null),
    setItem(key, value) {
      this.data[key] = String(value);
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
    },
    removeItem(key) {
      delete this.data[key];
    },
  };
  persist.setSubmissionsPersistStorage(mem);
  persist.cancelSubmissionsPersist();
  const seeded = demoSeed.createDemoSubmissionsState();
  persist.persistAfterSubmissionsAction("submissions/updateEda", seeded);
  assert.equal(mem.getItem(demoSeed.SUBMISSIONS_STORAGE_KEY), null);
  persist.flushSubmissionsPersist();
  assert.equal(JSON.parse(mem.getItem(demoSeed.SUBMISSIONS_STORAGE_KEY)).version, demoSeed.SUBMISSIONS_STORAGE_VERSION);
  mem.removeItem(demoSeed.SUBMISSIONS_STORAGE_KEY);
  persist.persistAfterSubmissionsAction("submissions/submitMonthlyPackage", seeded);
  assert.ok(mem.getItem(demoSeed.SUBMISSIONS_STORAGE_KEY));
  persist.setSubmissionsPersistStorage({
    setItem() {
      throw new Error("QuotaExceededError");
    },
  });
  persist.persistSubmissionsNow(seeded);

  persist.setSubmissionsPersistStorage(mem);
  directory.directoryDb.addOrgContact("tp-2", "Temp User", "temp.user@s4g.test");
  demoReset.resetDemoWorkspaceData();
  assert.equal(directory.directoryDb.getEntity("tp-2").orgContacts.length, 1);
  assert.ok(demoReset.RESET_PRESERVES_KEYS.includes("s4g-session"));
  assert.equal(demoReset.RESET_CLEARS_KEYS.includes("s4g-session"), false);

  console.log("Demo scope verification passed: aggregation, status, XLSX, notification adapter, and coverage checks.");
  persist.cancelSubmissionsPersist();
  persist.setSubmissionsPersistStorage(undefined);
} finally {
  await vite.close();
}
