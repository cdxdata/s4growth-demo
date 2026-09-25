import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { DEFAULT_PERIOD_ID, getPeriodById } from "@/constants/periods";
import { resolveProviderId } from "@/lib/providerScope";
import { getPeriodSubmission, markPackageStatus, setProviderPeriodStatus, updateTechnical } from "@/store/submissionsSlice";
import { updateDraft } from "@/store/intakeSlice";
import { showToast } from "@/store/uiSlice";
import { edaFillState, isTechnicalValid } from "@/lib/submissionDocuments";
import {
  ADD_KEYWORD,
  NONE_ACHIEVEMENT,
  NONE_CHALLENGE,
  achievementTextForKeyword,
  addCustomKeyword,
  applyTechnicalDefaults,
  emptyMediaLinkRow,
  emptyTestimonial,
  fileFromBrowser,
  readFileAsDataUrl,
} from "@/lib/technicalReport";
import type { AchievementRow, ChallengeRow, IntakeDraft, MediaLinkRow, PlanRow, TestimonialSection } from "@/types/domain";

export type IntakeSummary = ReturnType<typeof useIntake>;

function resolvePeriodId(paramId: string | undefined, selectedId: string): string {
  if (paramId) return paramId;
  const selected = getPeriodById(selectedId);
  if (selected.kind === "monthly") return selected.id;
  return DEFAULT_PERIOD_ID;
}

export function useIntake() {
  const { periodId: periodParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedPeriodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const periodId = resolvePeriodId(periodParam, selectedPeriodId);
  const period = getPeriodById(periodId);
  const role = useAppSelector((state) => state.auth.identity?.role);
  const identity = useAppSelector((state) => state.auth.identity);
  const organizationName = identity?.role === "training-provider"
    ? (identity.organizationName ?? "Piedmont Community College")
    : "Piedmont Community College";
  const providerId = resolveProviderId(identity);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const intakeDraft = useAppSelector((state) => state.intake.draft);
  const isTrainingProvider = role === "training-provider";
  const storedForm = isTrainingProvider || periodParam ? record.technical : intakeDraft;
  const form = {
    ...storedForm,
    testimonial: storedForm.testimonial ?? emptyTestimonial(),
    mediaLink: storedForm.mediaLink ?? emptyMediaLinkRow(),
  };
  const edaFilled = edaFillState(record.eda) === "filled";
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const patch = applyTechnicalDefaults(form, record.eda);
    if (Object.keys(patch).length === 0) return;
    persist(patch);
  }, [form, record.eda]);

  function persist(patch: Partial<IntakeDraft>) {
    dispatch(updateTechnical({ providerId, periodId, patch }));
    if (!isTrainingProvider && !periodParam) dispatch(updateDraft(patch));
  }

  function replace<K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) {
    persist({ [key]: value } as Partial<IntakeDraft>);
  }

  return {
    form,
    error,
    showErrors,
    isSubmitting: false,
    isTrainingProvider,
    monthLabel: period.windowLabel,
    organizationName,
    periodId,
    edaFilled,
    showMarks: record.review["technical-report"].score === "Flagged",
    fieldMarks: record.review["technical-report"].fieldMarks,
    goEda() {
      navigate(edaFilled ? `/submissions/${periodId}/eda/review` : `/submissions/${periodId}/eda/training-provider`);
    },
    updateChallenge(index: number, patch: Partial<ChallengeRow>) {
      const next = form.challenges.map((row, item) => {
        if (item !== index) return row;
        const keyword = patch.keyword ?? row.keyword;
        if (keyword === ADD_KEYWORD) return { ...row, ...patch };
        if (keyword === NONE_CHALLENGE) return { keyword, detail: "None" };
        const detail = patch.detail ?? (keyword !== row.keyword && row.detail === "None" ? "" : row.detail);
        return { keyword, detail };
      });
      replace("challenges", next);
    },
    addChallenge() {
      const keyword = form.challengeKeywords.find((item) => item !== NONE_CHALLENGE) ?? NONE_CHALLENGE;
      replace("challenges", [...form.challenges, { keyword, detail: keyword === NONE_CHALLENGE ? "None" : "" }]);
    },
    removeChallenge(index: number) {
      if (form.challenges.length <= 1) return;
      replace("challenges", form.challenges.filter((_, item) => item !== index));
    },
    addChallengeKeyword(index: number, value: string) {
      const keywords = addCustomKeyword(form.challengeKeywords, value, NONE_CHALLENGE);
      persist({
        challengeKeywords: keywords,
        challenges: form.challenges.map((row, item) => (item === index ? { keyword: value.trim(), detail: row.detail === "None" ? "" : row.detail } : row)),
      });
    },
    updatePlan(index: number, patch: Partial<PlanRow>) {
      replace(
        "plans",
        form.plans.map((row, item) => {
          if (item !== index) return row;
          const next = { ...row, ...patch };
          if (patch.plan !== undefined && patch.plan.trim() === "None") {
            next.potentialGain = "None";
          } else if (patch.plan !== undefined && row.plan.trim() === "None" && row.potentialGain.trim() === "None") {
            next.potentialGain = "";
          }
          return next;
        }),
      );
    },
    addPlan() {
      replace("plans", [...form.plans, { plan: "", potentialGain: "" }]);
    },
    removePlan(index: number) {
      if (form.plans.length <= 1) return;
      replace("plans", form.plans.filter((_, item) => item !== index));
    },
    updateAchievement(index: number, patch: Partial<AchievementRow>) {
      const next = form.achievements.map((row, item) => {
        if (item !== index) return row;
        const keyword = patch.keyword ?? row.keyword;
        if (keyword === ADD_KEYWORD) return { ...row, ...patch };
        if (keyword === NONE_ACHIEVEMENT) return { keyword, detail: "None" };
        if (patch.detail !== undefined) return { keyword, detail: patch.detail };
        const generated = achievementTextForKeyword(keyword, record.eda);
        const detail = keyword !== row.keyword ? generated || (row.detail === "None" ? "" : row.detail) : row.detail;
        return { keyword, detail };
      });
      replace("achievements", next);
    },
    addAchievement() {
      const keyword = form.achievementKeywords.find((item) => item !== NONE_ACHIEVEMENT) ?? NONE_ACHIEVEMENT;
      const detail = keyword === NONE_ACHIEVEMENT ? "None" : achievementTextForKeyword(keyword, record.eda);
      replace("achievements", [...form.achievements, { keyword, detail }]);
    },
    removeAchievement(index: number) {
      if (form.achievements.length <= 1) return;
      replace("achievements", form.achievements.filter((_, item) => item !== index));
    },
    addAchievementKeyword(index: number, value: string) {
      const keywords = addCustomKeyword(form.achievementKeywords, value, NONE_ACHIEVEMENT);
      persist({
        achievementKeywords: keywords,
        achievements: form.achievements.map((row, item) => (item === index ? { keyword: value.trim(), detail: row.detail === "None" ? "" : row.detail } : row)),
      });
    },
    updateTestimonial(patch: Partial<TestimonialSection>) {
      if (patch.available === "None") {
        replace("testimonial", { available: "None", detail: "None", files: [] });
        return;
      }
      if (patch.available === "Yes") {
        replace("testimonial", { available: "Yes", detail: "", files: form.testimonial.files.length ? form.testimonial.files : [null] });
        return;
      }
      replace("testimonial", { ...form.testimonial, ...patch });
    },
    async attachTestimonial(index: number, file: File | undefined) {
      const next = file ? fileFromBrowser(file, await readFileAsDataUrl(file)) : null;
      const files = form.testimonial.files.map((item, itemIndex) => (itemIndex === index ? next : item));
      replace("testimonial", { ...form.testimonial, files });
    },
    addTestimonialFile() {
      replace("testimonial", { ...form.testimonial, available: "Yes", detail: "", files: [...form.testimonial.files, null] });
    },
    removeTestimonialFile(index: number) {
      if (form.testimonial.files.length <= 1) return;
      replace("testimonial", { ...form.testimonial, files: form.testimonial.files.filter((_, item) => item !== index) });
    },
    updateMediaLink(patch: Partial<MediaLinkRow>) {
      if (patch.available === "None") {
        replace("mediaLink", { available: "None", detail: "None" });
        return;
      }
      if (patch.available === "Yes") {
        replace("mediaLink", { available: "Yes", detail: form.mediaLink.detail === "None" ? "" : form.mediaLink.detail });
        return;
      }
      replace("mediaLink", { ...form.mediaLink, ...patch });
    },
    saveDraft() {
      dispatch(showToast("Technical report saved."));
      navigate(isTrainingProvider ? "/submissions" : "/providers/1");
    },
    submit() {
      if (!isTechnicalValid(form)) {
        setShowErrors(true);
        setError("Complete the required technical report sections before submitting.");
        return;
      }
      setError("");
      setShowErrors(false);
      if (isTrainingProvider) {
        dispatch(showToast("Technical report saved."));
        navigate("/submissions");
        return;
      }
      dispatch(markPackageStatus({ providerId, periodId, status: "Approved" }));
      dispatch(setProviderPeriodStatus({ providerId, periodId, status: "Complete" }));
      dispatch(showToast("Technical report saved; the provider tracker is now complete."));
      navigate(`/providers/${providerId}`);
    },
    goBack() {
      navigate(isTrainingProvider ? "/submissions" : "/providers/1");
    },
  };
}
