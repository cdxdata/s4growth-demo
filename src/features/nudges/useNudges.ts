import { useState } from "react";
import { simulatedNotificationAdapter } from "@/adapters/notifications";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { recordMail } from "@/store/submissionsSlice";
import type { NudgeFollowUp, NudgeLog, NudgeMessage } from "@/types/domain";
import type { ReviewMail } from "@/types/submissions";

export type NudgesSummary = {
  isLoading: boolean;
  error: Error | null;
  overdueCount: number;
  followUp: NudgeFollowUp[];
  message: NudgeMessage | null;
  sent: NudgeLog | null;
  sending: boolean;
  outbox: ReviewMail[];
  sendReminder: () => void;
};

export function useNudges(): NudgesSummary {
  const dispatch = useAppDispatch();
  const outbox = useAppSelector((state) => state.submissions.mail);
  const [sending, setSending] = useState(false);
  const reminder = outbox.find((mail) => mail.id.startsWith("sim-"));
  const followUp: NudgeFollowUp[] = [
    { id: "ccs", label: "Central Carolina Skills", text: "Technical report not submitted · 3 days overdue", ok: Boolean(reminder) },
    { id: "pcc", label: "Piedmont Community College", text: "September packet is ready for review", ok: true },
    { id: "twa", label: "Triad Workforce Alliance", text: "No action required", ok: true },
  ];
  const message: NudgeMessage = {
    to: "Carlos Bennett, PI",
    cc: "Finance contact, instructor",
    subject: "Action needed: September Steps4Growth report",
    body: "Hello Carlos,\n\nThe September technical report for Central Carolina Skills has not yet been received. Please submit the structured report and participant-data update so NC A&T can complete monthly review.\n\nCurrent due date: September 17, 2026\nStatus: 3 days overdue",
  };

  return {
    isLoading: false,
    error: null,
    overdueCount: reminder ? 0 : 1,
    followUp,
    message,
    sent: reminder ? {
      organization: "Central Carolina Skills",
      recipient: reminder.recipients.join(", "),
      timestamp: reminder.sentOn,
      status: "Simulated sent",
    } : null,
    sending,
    outbox,
    async sendReminder() {
      if (reminder || sending) return;
      setSending(true);
      try {
        dispatch(recordMail(await simulatedNotificationAdapter.send({
          providerId: 3,
          periodId: "2026-09",
          recipients: ["carlos.bennett@example.org", "finance@example.org", "instructor@example.org"],
          subject: message.subject,
          body: message.body,
          status: "Missing/flagged",
        })));
      } finally {
        setSending(false);
      }
    },
  };
}
