import { directoryDb } from "@/api/directoryDb";
import type { AppDispatch } from "@/app/store";
import { buildStatusEmail } from "@/lib/reviewModel";
import { recordMail, setProviderPeriodStatus } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { SubmissionStatus } from "@/types/domain";
import type { PeriodSubmissionRecord, ReviewMail } from "@/types/submissions";

export function notifyStatusChange(
  dispatch: AppDispatch,
  input: {
    providerId: number;
    periodId: string;
    status: SubmissionStatus;
    record: PeriodSubmissionRecord;
    previous?: SubmissionStatus | null;
    force?: boolean;
    source?: ReviewMail["source"];
  },
) {
  if (input.previous === input.status && !input.force) return;
  if (input.previous !== input.status) {
    dispatch(
      setProviderPeriodStatus({
        providerId: input.providerId,
        periodId: input.periodId,
        status: input.status,
      }),
    );
  }
  const { providerName, recipients } = directoryDb.getReviewRecipients(input.providerId);
  const message = buildStatusEmail({
    providerName,
    periodId: input.periodId,
    status: input.status,
    record: input.record,
  });
  dispatch(
    recordMail({
      id: `sim-${Date.now()}`,
      periodId: input.periodId,
      providerId: input.providerId,
      recipients,
      subject: message.subject,
      body: message.body,
      sentOn: new Date().toLocaleString(),
      status: input.status,
      kind: "status",
      source: input.source ?? "project-manager",
    }),
  );
  dispatch(showToast(`Email sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`));
}
