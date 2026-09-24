import { directoryDb } from "@/api/directoryDb";
import type { AppDispatch } from "@/app/store";
import { DEMO_TODAY } from "@/lib/reportingDates";
import { buildStatusEmail } from "@/lib/reviewModel";
import { recordMail, setProviderPeriodStatus } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { SubmissionStatus } from "@/types/domain";
import type { PeriodSubmissionRecord } from "@/types/submissions";

export function notifyStatusChange(
  dispatch: AppDispatch,
  input: {
    providerId: number;
    periodId: string;
    status: SubmissionStatus;
    record: PeriodSubmissionRecord;
    previous?: SubmissionStatus | null;
    force?: boolean;
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
      id: `mail-${Date.now().toString(36)}`,
      periodId: input.periodId,
      providerId: input.providerId,
      recipients,
      subject: message.subject,
      body: message.body,
      sentOn: DEMO_TODAY,
      status: input.status,
    }),
  );
  dispatch(showToast(`Email sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`));
}
