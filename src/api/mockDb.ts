import { dashboardViewForPeriod, providersForPeriod } from "@/api/dashboardByPeriod";
import { TRAINING_PROVIDERS } from "@/constants/organizations";
import { DEMO_TODAY, formatCompletedDate } from "@/lib/reportingDates";
import type {
  ActivityEvent,
  ChecklistItem,
  Contact,
  DashboardPayload,
  IntakeDraft,
  NudgeLog,
  NudgesPayload,
  Participant,
  ParticipantsPayload,
  Provider,
  ProviderDetail,
  QuarterlyDraft,
  ReviewFlag,
  ReviewPayload,
} from "@/types/domain";
import {
  defaultIntakeDraft,
  readNotificationLog,
  readWorkbookImported,
  writeNotificationLog,
  writeWorkbookImported,
} from "@/lib/storage";

const PIEDMONT_ID = 1;

type DbState = {
  providers: Provider[];
  participants: Participant[];
  flags: ReviewFlag[];
  intake: IntakeDraft | null;
  completeSubmissions: number;
  openFlags: number;
  reportedVariances: number;
  resolvedThisMonth: number;
  workbookImported: boolean;
  nudgeLog: NudgeLog | null;
};

function createProviders(): Provider[] {
  return providersForPeriod("2026-09").slice(0, 3).map((provider) => ({ ...provider }));
}

function createParticipants(): Participant[] {
  return [
    {
      id: "p-01",
      firstName: "Jordan",
      lastName: "Lewis",
      trainingStart: "Sep 02, 2026",
      trainingEnd: "Dec 14, 2026",
      completed: "No",
      jobStart: "—",
      dataQuality: "Missing completion date",
      tone: "review",
    },
    {
      id: "p-02",
      firstName: "Maya",
      lastName: "Foster",
      trainingStart: "Jul 12, 2026",
      trainingEnd: "Aug 28, 2026",
      completed: "Yes",
      jobStart: "Sep 05, 2026",
      dataQuality: "Complete",
      tone: "complete",
    },
    {
      id: "p-03",
      firstName: "Darius",
      lastName: "Williams",
      trainingStart: "Jun 04, 2026",
      trainingEnd: "Aug 30, 2026",
      completed: "Yes",
      jobStart: "Sep 09, 2026",
      dataQuality: "Complete",
      tone: "complete",
    },
    {
      id: "p-04",
      firstName: "Amara",
      lastName: "Jones",
      trainingStart: "Aug 18, 2026",
      trainingEnd: "—",
      completed: "No",
      jobStart: "—",
      dataQuality: "Active training",
      tone: "draft",
    },
    {
      id: "p-05",
      firstName: "Ethan",
      lastName: "Rivera",
      trainingStart: "May 21, 2026",
      trainingEnd: "Aug 14, 2026",
      completed: "Yes",
      jobStart: "—",
      dataQuality: "Missing job start date",
      tone: "review",
    },
  ];
}

function createFlags(): ReviewFlag[] {
  return [
    {
      id: "flag-completion-total",
      title: "Completion total does not match participant records",
      text: "Piedmont Community College reported 12 completions. The selected participant dataset currently shows 10.",
      tag: "High priority",
      date: "Sep 16, 2026",
      action: "confirm-total",
      actionText: "Confirm total",
      resolved: false,
    },
    {
      id: "flag-missing-date",
      title: "Missing training completion date",
      text: "Jordan Lewis is marked as active, but the technical report includes this participant in the completion count.",
      tag: "Data quality",
      date: "Sep 16, 2026",
      action: "view-record",
      actionText: "View record",
      resolved: false,
    },
    {
      id: "flag-late-report",
      title: "Monthly technical report not submitted",
      text: "Central Carolina Skills is three days past the September due date.",
      tag: "Follow-up",
      date: "Sep 16, 2026",
      action: "preview-nudge",
      actionText: "Preview nudge",
      resolved: false,
    },
    {
      id: "flag-salary",
      title: "Salary reporting percentage is blank",
      text: "Triad Workforce Alliance did not provide the optional salary coverage percentage.",
      tag: "Low priority",
      date: "Sep 16, 2026",
      action: "dismiss",
      actionText: "Dismiss",
      resolved: false,
    },
  ];
}

function createInitialState(): DbState {
  return {
    providers: createProviders(),
    participants: createParticipants(),
    flags: createFlags(),
    intake: null,
    completeSubmissions: 2,
    openFlags: 4,
    reportedVariances: 1,
    resolvedThisMonth: 5,
    workbookImported: readWorkbookImported(),
    nudgeLog: readNotificationLog(),
  };
}

let state = createInitialState();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function piedmontComplete(): boolean {
  return state.providers[0]?.submissionStatus === "Complete";
}

function completionFlagResolved(): boolean {
  return Boolean(state.flags.find((flag) => flag.id === "flag-completion-total")?.resolved);
}

function resolveCompletionFlag(): void {
  const flag = state.flags.find((item) => item.id === "flag-completion-total");
  if (!flag || flag.resolved) return;
  flag.resolved = true;
  state.openFlags -= 1;
  state.reportedVariances = 0;
  state.resolvedThisMonth += 1;
}

function markPiedmontComplete(): void {
  const provider = state.providers.find((item) => item.id === PIEDMONT_ID);
  if (!provider || provider.submissionStatus === "Complete") return;
  provider.submissionStatus = "Complete";
  provider.completedOn = DEMO_TODAY;
  provider.statusChangedOn = DEMO_TODAY;
  state.completeSubmissions += 1;
}

function checklistFor(provider: Provider): ChecklistItem[] {
  if (provider.id !== PIEDMONT_ID) {
    const submitted = provider.submissionStatus === "Complete";
    return [
      {
        id: "participant-data",
        label: "EDA participant data",
        text: submitted ? "Participant workbook received" : "Awaiting monthly workbook",
        ok: submitted || provider.submissionStatus !== "Not started",
      },
      {
        id: "narrative",
        label: "Monthly technical report",
        text: submitted ? "Narrative submitted" : provider.submissionStatus,
        ok: submitted,
      },
    ];
  }

  const complete = piedmontComplete();
  const verified = complete || completionFlagResolved();
  return [
    {
      id: "eda",
      label: "EDA participant data",
      text: "18 participants imported · received Sep 15",
      ok: true,
    },
    {
      id: "successes",
      label: "Successes and achievements",
      text: "Narrative submitted",
      ok: true,
    },
    {
      id: "challenges",
      label: "Challenges and action plan",
      text: complete ? "Narrative submitted" : "Required narrative response is blank",
      ok: complete,
    },
    {
      id: "completion",
      label: "Completion total verified",
      text: verified
        ? "Human reviewer confirmed the total."
        : "Reported 12 · participant records show 10",
      ok: verified,
    },
  ];
}

function contactsFor(provider: Provider): Contact[] {
  if (provider.id === PIEDMONT_ID) {
    return [
      { initials: "JA", name: "Jordan Alvarez", role: "Principal investigator · Primary" },
      { initials: "MS", name: "Miriam Stone", role: "Finance · CC" },
      { initials: "TS", name: "Tasha Smith", role: "Instructor · CC" },
    ];
  }
  if (provider.id === 3) {
    return [
      { initials: "CB", name: "Carlos Bennett", role: "Principal investigator · Primary" },
      { initials: "FN", name: "Finance contact", role: "Finance · CC" },
    ];
  }
  return [
    { initials: provider.name.slice(0, 2).toUpperCase(), name: `${provider.name} lead`, role: "Primary contact" },
  ];
}

function activityFor(provider: Provider): ActivityEvent[] {
  if (provider.id !== PIEDMONT_ID) {
    const idle = provider.submissionStatus === "Not started" || provider.submissionStatus === "Missing/flagged";
    return [
      {
        icon: idle ? "!" : "✓",
        title: provider.submissionStatus,
        text: formatCompletedDate(provider.submissionStatus === "Complete" ? provider.completedOn : null),
      },
    ];
  }
  const complete = piedmontComplete();
  return [
    {
      icon: "✓",
      title: complete ? "Intake submitted and reviewed" : "Participant workbook received",
      text: complete ? "Just now" : "Sep 15 · 10:42 AM",
    },
    {
      icon: "!",
      title: "Review flag raised",
      text: "Completion total variance · Sep 15",
    },
  ];
}

export const mockDb = {
  getDashboard(periodId: string): DashboardPayload {
    const view = dashboardViewForPeriod(periodId);
    if (periodId !== "2026-09") return clone(view);

    const piedmont = state.providers.find((item) => item.id === PIEDMONT_ID);
    return clone({
      ...view,
      stats: {
        ...view.stats,
        completeSubmissions: state.completeSubmissions,
        openFlags: state.openFlags,
      },
      providers: view.providers.map((provider) =>
        provider.id === PIEDMONT_ID && piedmont ? { ...provider, ...piedmont, name: provider.name, backbone: provider.backbone } : provider,
      ),
    });
  },

  getProvider(id: number): ProviderDetail | null {
    const fromState = state.providers.find((item) => item.id === id);
    const fromPeriod = providersForPeriod("2026-09").find((item) => item.id === id);
    const fromCatalog = TRAINING_PROVIDERS.find((item) => item.id === id);
    const provider =
      fromState ??
      fromPeriod ??
      (fromCatalog
        ? {
            ...fromCatalog,
            type: "Training provider" as const,
            submissionStatus: "Not started" as const,
            completedOn: null,
            dueOn: "2026-09-17",
            statusChangedOn: null,
          }
        : null);
    if (!provider) return null;
    const complete = provider.id === PIEDMONT_ID ? piedmontComplete() : provider.submissionStatus === "Complete";
    return clone({
      provider,
      checklist: checklistFor(provider),
      contacts: contactsFor(provider),
      activity: activityFor(provider),
      openGaps: complete ? 0 : provider.id === PIEDMONT_ID ? 2 : 1,
    });
  },

  getParticipants(): ParticipantsPayload {
    return clone({
      imported: state.workbookImported,
      records: state.participants,
      metrics: {
        records: 18,
        trainingComplete: 10,
        placements: 7,
        missingData: 2,
      },
    });
  },

  importWorkbook(): ParticipantsPayload {
    writeWorkbookImported();
    state.workbookImported = true;
    return this.getParticipants();
  },

  getReview(): ReviewPayload {
    return clone({
      stats: {
        openFlags: state.openFlags,
        missingInformation: 2,
        reportedVariances: state.reportedVariances,
        resolvedThisMonth: state.resolvedThisMonth,
      },
      flags: state.flags.filter((flag) => !flag.resolved),
    });
  },

  confirmCompletionTotal(): ReviewPayload {
    resolveCompletionFlag();
    return this.getReview();
  },

  submitIntake(draft: IntakeDraft): ReviewPayload {
    state.intake = { ...draft };
    markPiedmontComplete();
    resolveCompletionFlag();
    return this.getReview();
  },

  getNudges(): NudgesPayload {
    return clone({
      overdueCount: 1,
      followUp: [
        {
          id: "ccs",
          label: "Central Carolina Skills",
          text: "Technical report not submitted · 3 days overdue",
          ok: false,
        },
        {
          id: "pcc",
          label: "Piedmont Community College",
          text: "Completion total needs reviewer confirmation",
          ok: completionFlagResolved(),
        },
        {
          id: "twa",
          label: "Triad Workforce Alliance",
          text: "No action required",
          ok: true,
        },
      ],
      message: {
        to: "Carlos Bennett, PI",
        cc: "Finance contact, instructor",
        subject: "Action needed: September Steps4Growth report",
        body: "Hello Carlos,\n\nThe September technical report for Central Carolina Skills has not yet been received. Please submit the structured report and participant-data update so NC A&T can complete monthly review.\n\nCurrent due date: September 17, 2026\nStatus: 3 days overdue",
      },
      sent: state.nudgeLog,
    });
  },

  sendNudge(): NudgeLog {
    const record: NudgeLog = {
      organization: "Central Carolina Skills",
      recipient: "Carlos Bennett, PI",
      timestamp: new Date().toLocaleString(),
      status: "Simulated sent",
    };
    writeNotificationLog(record);
    state.nudgeLog = record;
    return clone(record);
  },

  getQuarterlyDraft(): QuarterlyDraft {
    const intake = state.intake ?? defaultIntakeDraft;
    const fromIntake = Boolean(state.intake);
    return clone({
      enrolled: 63,
      completions: 38,
      placements: 27,
      achievements: fromIntake
        ? intake.achievements
        : "Across the network, training providers continued to expand regional workforce pathways, deepen employer relationships, and support participant advancement.",
      challenges: fromIntake
        ? intake.challenges
        : "Reporting completeness remains uneven across providers. The team will use structured monthly intake and targeted follow-up to identify gaps earlier in the reporting cycle.",
      plan: fromIntake
        ? intake.plan
        : "Continue monthly review, prioritize incomplete submissions, and confirm participant-level outcome totals before quarterly consolidation.",
      quote: "“The new manufacturing pathway gave me a clear way to move from training into a job I can grow with.”",
      fromIntake,
    });
  },
};
