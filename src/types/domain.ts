export const SUBMISSION_STATUSES = [
  "Complete",
  "In review",
  "Awaiting review",
  "Not started",
  "Missing/flagged",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export type StatusTone = "complete" | "review" | "late" | "draft";

export type ProviderType = "Training provider" | "Backbone" | "Employment liaison";

export type Provider = {
  id: number;
  name: string;
  type: ProviderType;
  backbone: string | null;
  code: string;
  program: string;
  region: string;
  enrolled: number;
  completed: number;
  placed: number;
  submissionStatus: SubmissionStatus;
  completedOn: string | null;
  dueOn: string;
  statusChangedOn: string | null;
};

export type ChecklistItem = {
  id: string;
  label: string;
  text: string;
  ok: boolean;
};

export type Contact = {
  initials: string;
  name: string;
  role: string;
};

export type ActivityEvent = {
  icon: string;
  title: string;
  text: string;
};

export type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  trainingStart: string;
  trainingEnd: string;
  completed: "Yes" | "No";
  jobStart: string;
  dataQuality: string;
  tone: StatusTone;
};

export type ReviewFlagAction =
  | "confirm-total"
  | "view-record"
  | "preview-nudge"
  | "dismiss";

export type ReviewFlag = {
  id: string;
  title: string;
  text: string;
  tag: string;
  date: string;
  action: ReviewFlagAction;
  actionText: string;
  resolved: boolean;
};

export type IntakeDraft = {
  achievements: string;
  challenges: string;
  plan: string;
  story: string;
};

export type NudgeFollowUp = {
  id: string;
  label: string;
  text: string;
  ok: boolean;
};

export type NudgeMessage = {
  to: string;
  cc: string;
  subject: string;
  body: string;
};

export type NudgeLog = {
  organization: string;
  recipient: string;
  timestamp: string;
  status: string;
};

export type DashboardStats = {
  organizationCount: number;
  completeSubmissions: number;
  needsFollowUp: number;
  openFlags: number;
};

export type ReviewStats = {
  openFlags: number;
  missingInformation: number;
  reportedVariances: number;
  resolvedThisMonth: number;
};

export type ImpactMetricId = "median-time" | "first-attempt";

export type ImpactMetric = {
  id: ImpactMetricId;
  label: string;
  badge: string;
  before: string;
  after: string;
};

export type QuarterlyDraft = {
  enrolled: number;
  completions: number;
  placements: number;
  achievements: string;
  challenges: string;
  plan: string;
  quote: string;
  fromIntake: boolean;
};

export type ProviderDetail = {
  provider: Provider;
  checklist: ChecklistItem[];
  contacts: Contact[];
  activity: ActivityEvent[];
  openGaps: number;
};

export type DashboardPayload = {
  stats: DashboardStats;
  completeNote: string;
  followUpNote: string;
  panelTitle: string;
  panelSubtitle: string;
  pageSubtitle: string;
  impact: ImpactMetric[];
  providers: Provider[];
  priority: ActivityEvent[];
};

export type ReviewPayload = {
  stats: ReviewStats;
  flags: ReviewFlag[];
};

export type NudgesPayload = {
  followUp: NudgeFollowUp[];
  message: NudgeMessage;
  sent: NudgeLog | null;
  overdueCount: number;
};

export type ParticipantsPayload = {
  imported: boolean;
  records: Participant[];
  metrics: {
    records: number;
    trainingComplete: number;
    placements: number;
    missingData: number;
  };
};
