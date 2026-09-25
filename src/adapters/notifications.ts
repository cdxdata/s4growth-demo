import type { ReviewMail } from "@/types/submissions";

export type NotificationInput = {
  providerId: number;
  periodId: string;
  recipients: string[];
  subject: string;
  body: string;
  status: ReviewMail["status"];
};

export interface NotificationAdapter {
  send(input: NotificationInput): Promise<ReviewMail>;
}

export const simulatedNotificationAdapter: NotificationAdapter = {
  async send(input) {
    return {
      id: `sim-${Date.now()}`,
      ...input,
      sentOn: new Date().toLocaleString(),
    };
  },
};
