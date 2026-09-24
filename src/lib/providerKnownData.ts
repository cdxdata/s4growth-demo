import { programsForOrganization } from "@/constants/directorySeed";
import { TRAINING_PROVIDERS } from "@/constants/organizations";
import { programListsNeedSync, syncProgramSections } from "@/lib/edaProgramRecords";
import type { EdaParticipant, EdaSurveyDraft, SplitDate } from "@/types/submissions";

const PARTNERSHIP_BY_BACKBONE: Record<string, string> = {
  "Piedmont-Triad Workforce Board": "Piedmont-Triad Advanced Manufacturing Partnership",
  "Capital Area Workforce Development": "Capital Area Healthcare Partnership",
  "Eastern Carolina Workforce Consortium": "Eastern Carolina Digital Skills Partnership",
  "Western NC Skills Partnership": "Western NC Clean Energy Partnership",
};

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

export const emptySplitDate = (): SplitDate => ({ month: "", day: "", year: "" });

export function parseSplitDate(value: string): SplitDate {
  if (!value || value === "—") return emptySplitDate();
  const match = value.match(/^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/);
  if (!match) return emptySplitDate();
  return {
    month: MONTHS[match[1]] ?? "",
    day: match[2].padStart(2, "0"),
    year: match[3],
  };
}

export function formatSplitDate(value: SplitDate): string {
  if (!value.month || !value.day || !value.year) return "";
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = names[Number(value.month) - 1];
  return monthName ? `${monthName} ${Number(value.day)}, ${value.year}` : "";
}

export function isSplitDateComplete(value: SplitDate): boolean {
  return Boolean(value.month && value.day && value.year);
}

export function splitDateToDate(value: SplitDate): Date | null {
  if (!isSplitDateComplete(value)) return null;
  return new Date(Number(value.year), Number(value.month) - 1, Number(value.day));
}

export function trainingOverlapsMonth(person: EdaParticipant, year: number, month: number): boolean {
  const start = splitDateToDate(person.trainingStart);
  if (!start) return false;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  if (start > monthEnd) return false;
  const end = splitDateToDate(person.trainingEnd);
  return end ? end >= monthStart : true;
}

export function participantsForReportingMonth(
  participants: EdaParticipant[],
  programs: string[],
  year: number,
  month: number,
): EdaParticipant[] {
  const offered = new Set(programs.map((program) => program.trim()).filter(Boolean));
  return participants.filter((person) => {
    if (offered.size > 0 && !offered.has(person.trainingProgram)) return false;
    return trainingOverlapsMonth(person, year, month);
  });
}

export type ProviderKnownData = {
  name: string;
  programs: string[];
  sectoralPartnership: string;
  primaryProgram: string;
  state: string;
  participants: EdaParticipant[];
};

function emptyParticipant(provider: string, program: string): EdaParticipant {
  return {
    trainingProvider: provider,
    trainingProgram: program,
    firstName: "",
    middleName: "",
    lastName: "",
    trainingStart: emptySplitDate(),
    trainingEnd: emptySplitDate(),
    completedTraining: "",
    jobStart: emptySplitDate(),
    dateOfBirth: emptySplitDate(),
    street: "",
    street2: "",
    city: "",
    state: "NC",
    zip: "",
  };
}

const PIEDMONT_PARTICIPANTS: Array<Partial<EdaParticipant> & { firstName: string; lastName: string }> = [
  {
    firstName: "Jordan",
    lastName: "Lewis",
    trainingProgram: "Advanced Manufacturing",
    trainingStart: parseSplitDate("Sep 02, 2026"),
    trainingEnd: parseSplitDate("Dec 14, 2026"),
    completedTraining: "No",
    street: "214 Depot Street",
    city: "Roxboro",
    zip: "27573",
  },
  {
    firstName: "Maya",
    lastName: "Foster",
    trainingProgram: "CNC Fundamentals",
    trainingStart: parseSplitDate("Jul 12, 2026"),
    trainingEnd: parseSplitDate("Aug 28, 2026"),
    completedTraining: "Yes",
    jobStart: parseSplitDate("Sep 05, 2026"),
    street: "88 Gilbreath Road",
    city: "Burlington",
    zip: "27215",
  },
  {
    firstName: "Darius",
    lastName: "Williams",
    trainingProgram: "Advanced Manufacturing",
    trainingStart: parseSplitDate("Jun 04, 2026"),
    trainingEnd: parseSplitDate("Aug 30, 2026"),
    completedTraining: "Yes",
    jobStart: parseSplitDate("Sep 09, 2026"),
    street: "401 Main Street",
    city: "Roxboro",
    zip: "27573",
  },
  {
    firstName: "Amara",
    lastName: "Jones",
    trainingProgram: "CNC Fundamentals",
    trainingStart: parseSplitDate("Aug 18, 2026"),
    completedTraining: "No",
    street: "12 Court Square",
    city: "Yanceyville",
    zip: "27379",
  },
  {
    firstName: "Ethan",
    lastName: "Rivera",
    trainingProgram: "Advanced Manufacturing",
    trainingStart: parseSplitDate("May 21, 2026"),
    trainingEnd: parseSplitDate("Aug 14, 2026"),
    completedTraining: "Yes",
    street: "760 Durham Road",
    city: "Roxboro",
    zip: "27574",
  },
];

export function getProviderKnownData(organizationName: string): ProviderKnownData {
  const org = TRAINING_PROVIDERS.find((item) => item.name === organizationName);
  const programs = programsForOrganization(organizationName);
  const primaryProgram = org?.program ?? programs[0] ?? "";
  const participants =
    organizationName === "Piedmont Community College"
      ? PIEDMONT_PARTICIPANTS.map((person) => ({
          ...emptyParticipant(organizationName, person.trainingProgram ?? primaryProgram),
          ...person,
          trainingProvider: organizationName,
          state: "NC",
        }))
      : programs.length
        ? [emptyParticipant(organizationName, primaryProgram)]
        : [];

  return {
    name: organizationName,
    programs,
    sectoralPartnership: org?.backbone ? (PARTNERSHIP_BY_BACKBONE[org.backbone] ?? "") : "",
    primaryProgram,
    state: "NC",
    participants,
  };
}

export function applyKnownEdaDefaults(
  draft: EdaSurveyDraft,
  known: ProviderKnownData,
  period?: { year: number; month?: number },
): Partial<EdaSurveyDraft> {
  const patch: Partial<EdaSurveyDraft> = {};
  if (!draft.trainingProvider && known.name) patch.trainingProvider = known.name;
  if (!draft.trainingPrograms.some((program) => program.trim()) && known.programs.length) {
    patch.trainingPrograms = [...known.programs];
  }
  if (!draft.sectoralPartnership && known.sectoralPartnership) patch.sectoralPartnership = known.sectoralPartnership;
  if (!draft.noParticipants && draft.participants.length === 0 && known.participants.length) {
    const programs = (patch.trainingPrograms ?? draft.trainingPrograms).filter((program) => program.trim());
    const inMonth =
      period?.month != null
        ? participantsForReportingMonth(known.participants, programs, period.year, period.month)
        : known.participants.filter((person) => programs.length === 0 || programs.includes(person.trainingProgram));
    if (inMonth.length > 0) patch.participants = inMonth;
  }
  const merged = { ...draft, ...patch };
  if (programListsNeedSync(merged)) {
    Object.assign(patch, syncProgramSections(merged));
  }
  return patch;
}

export function createEmptyParticipant(provider: string, program: string): EdaParticipant {
  return emptyParticipant(provider, program);
}
