export type TechnicalSectionId = "eda" | "challenges" | "plans" | "achievements" | "testimonial" | "media";

export type TechnicalSectionSchema = {
  id: TechnicalSectionId;
  number: string;
  title?: string;
  required: boolean;
};

export type TechnicalIntakeSchema = {
  organizationType: "training-provider";
  name: string;
  sections: Record<TechnicalSectionId, TechnicalSectionSchema>;
};

export const COMMUNITY_COLLEGE_SCHEMA: TechnicalIntakeSchema = {
  organizationType: "training-provider",
  name: "Community College Form (Appendix 2)",
  sections: {
    eda: { id: "eda", number: "01", required: true },
    challenges: { id: "challenges", number: "02", title: "Challenges this month", required: true },
    plans: { id: "plans", number: "03", title: "Plan to address the challenges listed in 02", required: true },
    achievements: { id: "achievements", number: "04", title: "This month's achievement", required: true },
    testimonial: { id: "testimonial", number: "05", title: "Participant testimonial available?", required: true },
    media: { id: "media", number: "06", title: "Photo/video/article link", required: true },
  },
};

export const TECHNICAL_INTAKE_SCHEMAS = {
  "training-provider": COMMUNITY_COLLEGE_SCHEMA,
} as const;
