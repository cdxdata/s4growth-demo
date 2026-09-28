import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { simulatedNotificationAdapter } from "@/adapters/notifications";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { MONTH_NAMES, getPeriodById, getPeriodDueIso } from "@/constants/periods";
import { SYSTEM_LEAD } from "@/lib/reviewModel";
import { asOfDateForPeriod, formatTimelineStatus } from "@/lib/reportingDates";
import { recordMail } from "@/store/submissionsSlice";
import type { NudgeFollowUp, NudgeLog, NudgeMessage, SubmissionStatus } from "@/types/domain";
import type { ReviewMail } from "@/types/submissions";

const FOLLOW_UP_STATUSES = new Set<SubmissionStatus>(["Not started", "Missing/flagged"]);

export type NudgesSummary = {
  isLoading: boolean;
  error: Error | null;
  timelineStatus: string | null;
  followUp: NudgeFollowUp[];
  selectedId: string | null;
  selectFollowUp: (id: string) => void;
  message: NudgeMessage | null;
  sent: NudgeLog | null;
  sending: boolean;
  outbox: ReviewMail[];
  sendReminder: () => void;
};

function buildNudgeMessage(input: {
  organizationName: string;
  toName: string;
  toEmail: string;
  ccNames: string[];
  ccEmails: string[];
  month: string;
  dueDate: string;
  timelineStatus: string;
  status: SubmissionStatus;
}): NudgeMessage {
  const flagged = input.status === "Missing/flagged";
  const action = flagged
    ? `requires your attention. Please address the flagged issues and update so ${SYSTEM_LEAD} can complete monthly review.`
    : `has not yet been received. Please submit the structured report and participant-data update so ${SYSTEM_LEAD} can complete monthly review.`;
  return {
    to: input.toName,
    cc: input.ccNames.join(", ") || "No representatives",
    toEmail: input.toEmail,
    ccEmails: input.ccEmails,
    subject: `${flagged ? "Action needed" : "Not Started"}: ${input.month} Steps4Growth report`,
    body: [
      `Hello ${input.toName},`,
      "",
      `The ${input.month} technical report for ${input.organizationName} ${action}`,
      "",
      `Current due date: ${input.dueDate}`,
      `Status: ${input.timelineStatus}`,
    ].join("\n"),
  };
}

function isReminderMail(mail: ReviewMail) {
  if (mail.kind === "status") return false;
  if (mail.kind === "reminder") return true;
  return mail.id.startsWith("sim-") && /^(Not Started|Action needed):/.test(mail.subject);
}

export function useNudges(): NudgesSummary {
  const dispatch = useAppDispatch();
  const outbox = useAppSelector((state) => state.submissions.mail);
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const storedStatuses = useAppSelector((state) => state.submissions.providerStatus[periodId] ?? {});
  const period = getPeriodById(periodId);
  const dueOn = getPeriodDueIso(period);
  const asOf = asOfDateForPeriod(dueOn);
  const month = MONTH_NAMES[(period.month ?? 9) - 1];
  const dueDate = period.dueDateLong ?? `${month} 17, ${period.year}`;
  const query = useQuery({
    queryKey: queryKeys.dashboard(periodId),
    queryFn: () => reportingApi.getDashboard(periodId),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const followUp = useMemo(
    () =>
      (query.data?.providers ?? []).flatMap((provider) => {
        const stored = storedStatuses[String(provider.id)];
        const status = stored?.status ?? provider.submissionStatus;
        if (!FOLLOW_UP_STATUSES.has(status)) return [];
        return [
          {
            id: String(provider.id),
            label: provider.name,
            text: provider.backbone ? `via ${provider.backbone}` : provider.program,
            status,
          },
        ];
      }),
    [query.data?.providers, storedStatuses],
  );

  const followUpKey = followUp.map((item) => item.id).join("|");
  useEffect(() => {
    if (!followUp.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => (current && followUp.some((item) => item.id === current) ? current : followUp[0].id));
  }, [followUp, followUpKey]);

  const selected = followUp.find((item) => item.id === selectedId) ?? null;
  const selectedProviderId = selected ? Number(selected.id) : Number.NaN;
  const contactQuery = useQuery({
    queryKey: queryKeys.providerContact(selectedProviderId),
    queryFn: () => reportingApi.getProviderContact(selectedProviderId),
    enabled: Number.isFinite(selectedProviderId),
  });
  const repsQuery = useQuery({
    queryKey: queryKeys.providerRepresentatives(selectedProviderId),
    queryFn: () => reportingApi.getProviderRepresentatives(selectedProviderId),
    enabled: Number.isFinite(selectedProviderId),
  });

  const timelineStatus = followUp.length ? formatTimelineStatus(null, dueOn, asOf) : null;
  const contact = contactQuery.data;
  const representatives = repsQuery.data ?? [];
  const message =
    selected && contact
      ? buildNudgeMessage({
          organizationName: selected.label,
          toName: contact.name,
          toEmail: contact.email,
          ccNames: representatives.map((rep) => rep.name),
          ccEmails: representatives.map((rep) => rep.email),
          month,
          dueDate,
          timelineStatus: timelineStatus ?? "—",
          status: selected.status,
        })
      : null;
  const reminder = outbox.find((mail) => mail.providerId === selectedProviderId && isReminderMail(mail));

  return {
    isLoading: query.isLoading && !query.data,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load nudges") : null,
    timelineStatus,
    followUp,
    selectedId,
    selectFollowUp: setSelectedId,
    message,
    sent: reminder
      ? {
          organization: selected?.label ?? contact?.name ?? "Training provider",
          recipient: reminder.recipients.join(", "),
          timestamp: reminder.sentOn,
          status: "Simulated sent",
        }
      : null,
    sending,
    outbox: outbox.filter((mail) => mail.source !== "training-provider"),
    async sendReminder() {
      if (!selected || !message || reminder || sending) return;
      setSending(true);
      try {
        dispatch(
          recordMail(
            await simulatedNotificationAdapter.send({
              providerId: Number(selected.id),
              periodId,
              recipients: [message.toEmail, ...message.ccEmails].filter(Boolean),
              subject: message.subject,
              body: message.body,
              status: selected.status,
              kind: "reminder",
              source: "project-manager",
            }),
          ),
        );
      } finally {
        setSending(false);
      }
    },
  };
}
