import { TRAINING_PROVIDERS } from "@/constants/organizations";
import { getPeriodById, getPeriodDueIso } from "@/constants/periods";
import { addDays } from "@/lib/reportingDates";
import type { ActivityEvent, DashboardPayload, ImpactMetric, Provider, SubmissionStatus } from "@/types/domain";

type RowSpec = [SubmissionStatus, number | null, number | null];

type PeriodDashboard = {
  stats: DashboardPayload["stats"];
  completeNote: string;
  followUpNote: string;
  panelTitle: string;
  panelSubtitle: string;
  pageSubtitle: string;
  impact: ImpactMetric[];
  rows: RowSpec[];
  priority: ActivityEvent[];
};

const monthlyImpact = (
  beforeDays: string,
  afterDays: string,
  beforePct: string,
  afterPct: string,
  badgeDays: string,
  badgePts: string,
): ImpactMetric[] => [
  {
    id: "median-time",
    label: "Median Time to Complete",
    badge: badgeDays,
    before: beforeDays,
    after: afterDays,
  },
  {
    id: "first-attempt",
    label: "First-attempt Completion",
    badge: badgePts,
    before: beforePct,
    after: afterPct,
  },
];

const quarterlyImpact = (beforeDays: string, afterDays: string, beforePct: string, afterPct: string): ImpactMetric[] => [
  {
    id: "median-time",
    label: "Median Time to Complete",
    badge: "11 days saved",
    before: beforeDays,
    after: afterDays,
  },
  {
    id: "first-attempt",
    label: "First-attempt Completion",
    badge: "+28 points",
    before: beforePct,
    after: afterPct,
  },
];

function allCompleteRows(): RowSpec[] {
  return TRAINING_PROVIDERS.map((org, index) => {
    const offset = -((org.id * 3 + index) % 9);
    return ["Complete", offset, offset];
  });
}

const COMPLETE_PRIORITY: ActivityEvent[] = [
  { icon: "✓", title: "All packets approved", text: "15 of 15 training providers submitted complete files" },
  { icon: "✓", title: "No follow-up required", text: "Every subawardee is Complete for this window" },
  { icon: "✓", title: "Ready for rollup", text: "Forms are filled and reviews are closed" },
];

function providersFromSpecs(dueOn: string, specs: RowSpec[]): Provider[] {
  return TRAINING_PROVIDERS.map((org, index) => {
    const [submissionStatus, completedOffset, notifiedOffset] = specs[index] ?? ["Not started", null, null];
    const completedOn =
      submissionStatus === "Complete" && completedOffset !== null ? addDays(dueOn, completedOffset) : null;
    const statusChangedOn = notifiedOffset === null ? null : addDays(dueOn, notifiedOffset);
    return {
      ...org,
      type: "Training provider" as const,
      submissionStatus,
      completedOn,
      dueOn,
      statusChangedOn,
    };
  });
}

const PERIOD_VIEWS: Record<string, PeriodDashboard> = {
  "2026-04": {
    stats: { organizationCount: 24, completeSubmissions: 15, needsFollowUp: 0, openFlags: 0 },
    completeNote: "15 Training Providers submitted",
    followUpNote: "No follow-up required",
    panelTitle: "April submission status",
    panelSubtitle: "Third Thursday due date: April 16, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("11 days", "4 days", "18%", "42%", "7 days saved", "+24 points"),
    rows: allCompleteRows(),
    priority: COMPLETE_PRIORITY,
  },
  "2026-05": {
    stats: { organizationCount: 24, completeSubmissions: 15, needsFollowUp: 0, openFlags: 0 },
    completeNote: "15 Training Providers submitted",
    followUpNote: "No follow-up required",
    panelTitle: "May submission status",
    panelSubtitle: "Third Thursday due date: May 21, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("9 days", "3 days", "24%", "51%", "6 days saved", "+27 points"),
    rows: allCompleteRows(),
    priority: COMPLETE_PRIORITY,
  },
  "2026-06": {
    stats: { organizationCount: 24, completeSubmissions: 15, needsFollowUp: 0, openFlags: 0 },
    completeNote: "15 Training Providers submitted",
    followUpNote: "No follow-up required",
    panelTitle: "June submission status",
    panelSubtitle: "Third Thursday due date: June 18, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("8 days", "2 days", "31%", "68%", "6 days saved", "+37 points"),
    rows: allCompleteRows(),
    priority: COMPLETE_PRIORITY,
  },
  "2026-07": {
    stats: { organizationCount: 24, completeSubmissions: 15, needsFollowUp: 0, openFlags: 0 },
    completeNote: "15 Training Providers submitted",
    followUpNote: "No follow-up required",
    panelTitle: "July submission status",
    panelSubtitle: "Third Thursday due date: July 16, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("10 days", "3 days", "22%", "48%", "7 days saved", "+26 points"),
    rows: allCompleteRows(),
    priority: COMPLETE_PRIORITY,
  },
  "2026-08": {
    stats: { organizationCount: 24, completeSubmissions: 15, needsFollowUp: 0, openFlags: 0 },
    completeNote: "15 Training Providers submitted",
    followUpNote: "No follow-up required",
    panelTitle: "August submission status",
    panelSubtitle: "Third Thursday due date: August 20, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("8 days", "2 days", "29%", "61%", "6 days saved", "+32 points"),
    rows: allCompleteRows(),
    priority: COMPLETE_PRIORITY,
  },
  "2026-09": {
    stats: { organizationCount: 24, completeSubmissions: 2, needsFollowUp: 7, openFlags: 4 },
    completeNote: "2 submitted early",
    followUpNote: "3 late · 4 incomplete",
    panelTitle: "September submission status",
    panelSubtitle: "Third Thursday due date: September 17, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("8 days", "1 day", "35%", "75%", "7 days saved", "+40 points"),
    rows: [
      ["Missing/flagged", -2, -2],
      ["Complete", -5, -5],
      ["Not started", null, null],
      ["Complete", 0, 0],
      ["In review", -1, 3],
      ["Awaiting review", 1, 1],
      ["Complete", -7, -7],
      ["Not started", null, null],
      ["Complete", -2, -2],
      ["In review", 2, 2],
      ["Awaiting review", 0, 4],
      ["Missing/flagged", -3, -1],
      ["Complete", -6, -6],
      ["Not started", null, null],
      ["In review", 3, 3],
    ],
    priority: [
      { icon: "!", title: "Completion total needs verification", text: "Piedmont Community College · reported 12, records show 10" },
      { icon: "×", title: "Missing completion date", text: "Jordan Lewis · participant record" },
      { icon: "!", title: "Technical report not submitted", text: "Central Carolina Skills · 3 days overdue" },
    ],
  },
  "2026-q2": {
    stats: { organizationCount: 24, completeSubmissions: 15, needsFollowUp: 0, openFlags: 0 },
    completeNote: "15 Training Providers submitted",
    followUpNote: "No follow-up required",
    panelTitle: "Q2 submission status",
    panelSubtitle: "Reporting window: April – June 2026",
    pageSubtitle: "A clear view of this quarter’s reporting readiness.",
    impact: quarterlyImpact("14 days", "3 days", "41%", "69%"),
    rows: allCompleteRows(),
    priority: [
      { icon: "✓", title: "Q2 is complete", text: "April, May, and June packets are approved for every subawardee" },
      { icon: "✓", title: "Quarterly draft is ready", text: "Three-month totals and narratives can be assembled without gaps" },
      { icon: "✓", title: "No follow-up required", text: "The quarter closed with a perfect reporting record" },
    ],
  },
  "2026-q3": {
    stats: { organizationCount: 24, completeSubmissions: 9, needsFollowUp: 7, openFlags: 4 },
    completeNote: "Mid-to-late quarter",
    followUpNote: "3 late · 4 incomplete",
    panelTitle: "Q3 submission status",
    panelSubtitle: "Reporting window: July – September 2026",
    pageSubtitle: "A clear view of this quarter’s reporting readiness.",
    impact: quarterlyImpact("13 days", "2 days", "38%", "66%"),
    rows: [
      ["Missing/flagged", -15, -15],
      ["Complete", -18, -18],
      ["Not started", null, null],
      ["Complete", -13, -13],
      ["In review", -14, -10],
      ["Awaiting review", -12, -12],
      ["Complete", -20, -20],
      ["Not started", null, null],
      ["Complete", -16, -16],
      ["In review", -11, -11],
      ["Awaiting review", -13, -9],
      ["Missing/flagged", -17, -14],
      ["Complete", -19, -19],
      ["Not started", null, null],
      ["In review", -10, -10],
    ],
    priority: [
      { icon: "!", title: "September file is holding the quarter", text: "Central Carolina Skills · not submitted" },
      { icon: "!", title: "Q3 completion total needs verification", text: "Piedmont Community College · Sep variance" },
      { icon: "×", title: "Quarterly success story not yet attached", text: "Asheville Trades Institute · optional narrative" },
    ],
  },
};

export function providersForPeriod(periodId: string): Provider[] {
  const snapshot = PERIOD_VIEWS[periodId] ?? PERIOD_VIEWS["2026-09"];
  const dueOn = getPeriodDueIso(getPeriodById(periodId));
  return providersFromSpecs(dueOn, snapshot.rows);
}

export function dashboardViewForPeriod(periodId: string): DashboardPayload {
  const snapshot = PERIOD_VIEWS[periodId] ?? PERIOD_VIEWS["2026-09"];
  return {
    stats: snapshot.stats,
    completeNote: snapshot.completeNote,
    followUpNote: snapshot.followUpNote,
    panelTitle: snapshot.panelTitle,
    panelSubtitle: snapshot.panelSubtitle,
    pageSubtitle: snapshot.pageSubtitle,
    impact: snapshot.impact,
    providers: providersForPeriod(periodId),
    priority: snapshot.priority,
  };
}
