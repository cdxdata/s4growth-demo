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
    stats: { organizationCount: 24, completeSubmissions: 1, needsFollowUp: 9, openFlags: 6 },
    completeNote: "Cycle just opened",
    followUpNote: "2 late · 7 incomplete",
    panelTitle: "April submission status",
    panelSubtitle: "Third Thursday due date: April 16, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("11 days", "4 days", "18%", "42%", "7 days saved", "+24 points"),
    rows: [
      ["In review", -1, 0],
      ["Complete", -6, -6],
      ["Not started", null, null],
      ["Awaiting review", 0, 1],
      ["Not started", null, null],
      ["Missing/flagged", -2, -1],
      ["Complete", -4, -4],
      ["Not started", null, null],
      ["In review", 1, 2],
      ["Not started", null, null],
      ["Awaiting review", -3, -1],
      ["Not started", null, null],
      ["Complete", 0, 0],
      ["Not started", null, null],
      ["In review", -2, 1],
    ],
    priority: [
      { icon: "!", title: "Workbook not yet received", text: "Piedmont Community College · April cycle" },
      { icon: "!", title: "Narrative fields still blank", text: "Central Carolina Skills · monthly intake" },
      { icon: "×", title: "April files still unopened", text: "6 training providers have not started" },
    ],
  },
  "2026-05": {
    stats: { organizationCount: 24, completeSubmissions: 6, needsFollowUp: 8, openFlags: 5 },
    completeNote: "1 submitted early",
    followUpNote: "3 late · 5 incomplete",
    panelTitle: "May submission status",
    panelSubtitle: "Third Thursday due date: May 21, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("9 days", "3 days", "24%", "51%", "6 days saved", "+27 points"),
    rows: [
      ["Missing/flagged", -2, -2],
      ["Complete", -9, -9],
      ["Not started", null, null],
      ["Complete", -3, -3],
      ["In review", -1, 1],
      ["Awaiting review", 1, 1],
      ["Complete", -5, -5],
      ["Not started", null, null],
      ["Complete", 0, 0],
      ["In review", 2, 2],
      ["Awaiting review", 0, 2],
      ["Missing/flagged", -4, -3],
      ["Complete", -7, -7],
      ["Not started", null, null],
      ["In review", -1, 0],
    ],
    priority: [
      { icon: "!", title: "Technical report not submitted", text: "Central Carolina Skills · 2 days overdue" },
      { icon: "!", title: "Placement total needs a second look", text: "Piedmont Community College · reported 5, records show 4" },
      { icon: "×", title: "Missing job start dates", text: "Wilmington Marine Trades · flagged records" },
    ],
  },
  "2026-06": {
    stats: { organizationCount: 24, completeSubmissions: 15, needsFollowUp: 4, openFlags: 3 },
    completeNote: "4 submitted early",
    followUpNote: "1 late · 3 incomplete",
    panelTitle: "June submission status",
    panelSubtitle: "Third Thursday due date: June 18, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("8 days", "2 days", "31%", "68%", "6 days saved", "+37 points"),
    rows: [
      ["Complete", -2, -2],
      ["Complete", -7, -7],
      ["In review", 0, 1],
      ["Complete", 0, 0],
      ["Complete", -1, -1],
      ["Awaiting review", 1, 1],
      ["Complete", -4, -4],
      ["Missing/flagged", -3, -2],
      ["Complete", -5, -5],
      ["Complete", 2, 2],
      ["In review", 0, 2],
      ["Complete", -6, -6],
      ["Complete", -8, -8],
      ["Not started", null, null],
      ["Complete", -1, 0],
    ],
    priority: [
      { icon: "!", title: "Salary coverage percentage is blank", text: "Central Carolina Skills · optional Q2 field" },
      { icon: "✓", title: "June file ready for quarterly rollup", text: "Triad Workforce Alliance · no open gaps" },
      { icon: "!", title: "Confirm completion total before Q2 close", text: "Rocky Mount Logistics College · not started" },
    ],
  },
  "2026-07": {
    stats: { organizationCount: 24, completeSubmissions: 2, needsFollowUp: 10, openFlags: 5 },
    completeNote: "New quarter opening",
    followUpNote: "4 late · 6 incomplete",
    panelTitle: "July submission status",
    panelSubtitle: "Third Thursday due date: July 16, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("10 days", "3 days", "22%", "48%", "7 days saved", "+26 points"),
    rows: [
      ["Not started", null, null],
      ["Complete", -6, -6],
      ["Not started", null, null],
      ["Awaiting review", 0, 1],
      ["In review", 2, 3],
      ["Not started", null, null],
      ["Complete", -3, -3],
      ["Not started", null, null],
      ["In review", -1, 0],
      ["Missing/flagged", -2, -1],
      ["Not started", null, null],
      ["Not started", null, null],
      ["Complete", 0, 0],
      ["Not started", null, null],
      ["Awaiting review", 1, 2],
    ],
    priority: [
      { icon: "!", title: "July intake not started", text: "Central Carolina Skills · 4 days overdue" },
      { icon: "!", title: "Participant workbook pending", text: "Piedmont Community College · Q3 opening month" },
      { icon: "×", title: "Employer contacts not confirmed", text: "Several western and eastern providers still idle" },
    ],
  },
  "2026-08": {
    stats: { organizationCount: 24, completeSubmissions: 10, needsFollowUp: 6, openFlags: 3 },
    completeNote: "3 submitted early",
    followUpNote: "2 late · 4 incomplete",
    panelTitle: "August submission status",
    panelSubtitle: "Third Thursday due date: August 20, 2026",
    pageSubtitle: "A clear view of this month’s reporting readiness.",
    impact: monthlyImpact("8 days", "2 days", "29%", "61%", "6 days saved", "+32 points"),
    rows: [
      ["Complete", -2, -2],
      ["Complete", -7, -7],
      ["Missing/flagged", -1, 0],
      ["Complete", 0, 0],
      ["In review", -1, 1],
      ["Awaiting review", 2, 2],
      ["Complete", -4, -4],
      ["Not started", null, null],
      ["Complete", -5, -5],
      ["In review", 1, 1],
      ["Complete", 0, 1],
      ["Missing/flagged", -3, -2],
      ["Complete", -6, -6],
      ["Not started", null, null],
      ["In review", 3, 3],
    ],
    priority: [
      { icon: "!", title: "August report not submitted", text: "Asheville Trades Institute · still not started" },
      { icon: "!", title: "Challenges narrative is blank", text: "Central Carolina Skills · required field" },
      { icon: "✓", title: "August workbook reconciled", text: "Piedmont Community College · 17 records" },
    ],
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
    stats: { organizationCount: 24, completeSubmissions: 18, needsFollowUp: 3, openFlags: 2 },
    completeNote: "Quarter-end consolidation",
    followUpNote: "1 late · 2 incomplete",
    panelTitle: "Q2 submission status",
    panelSubtitle: "Reporting window: April – June 2026",
    pageSubtitle: "A clear view of this quarter’s reporting readiness.",
    impact: quarterlyImpact("14 days", "3 days", "41%", "69%"),
    rows: [
      ["Complete", -8, -8],
      ["Complete", -12, -12],
      ["In review", -2, 0],
      ["Complete", 0, 0],
      ["Complete", -4, -4],
      ["Awaiting review", 1, 1],
      ["Complete", -6, -6],
      ["Missing/flagged", -3, -2],
      ["Complete", -10, -10],
      ["Complete", 2, 2],
      ["Complete", -1, -1],
      ["Complete", -5, -5],
      ["Complete", -9, -9],
      ["Not started", null, null],
      ["Complete", -2, -1],
    ],
    priority: [
      { icon: "!", title: "Q2 narrative still incomplete", text: "Central Carolina Skills · challenges and action plan" },
      { icon: "✓", title: "Q2 participant rollup ready for review", text: "Triad Workforce Alliance · 62 records" },
      { icon: "!", title: "Salary coverage not reported", text: "Optional field · 2 providers" },
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
