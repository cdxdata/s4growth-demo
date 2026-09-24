import { BACKBONES, EMPLOYMENT_LIAISONS, TRAINING_PROVIDERS } from "@/constants/organizations";
import type { DirectoryEntity, Representative } from "@/types/auth";

const TP_PROGRAMS: Record<number, string[]> = {
  1: ["Advanced Manufacturing", "CNC Fundamentals"],
  2: ["Healthcare Pathways", "CNA", "Medical Billing"],
  9: ["CNC Machining", "Industrial Welding"],
  11: ["Cybersecurity", "IT Support"],
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

function makeReps(entityId: string, people: Array<[string, string]>): Representative[] {
  return people.map(([name, email], index) => ({
    id: `${entityId}-r${index + 1}`,
    entityId,
    name,
    email,
  }));
}

export function programsForOrganization(name: string): string[] {
  const org = TRAINING_PROVIDERS.find((item) => item.name === name);
  if (!org) return [];
  return TP_PROGRAMS[org.id] ?? [org.program];
}

export function createDirectoryEntities(): DirectoryEntity[] {
  const trainingProviders: DirectoryEntity[] = TRAINING_PROVIDERS.map((org) => ({
    id: `tp-${org.id}`,
    role: "training-provider",
    name: org.name,
    email: org.id === 1 ? "tp@tester.com" : `${slug(org.name)}@providers.s4g.test`,
    orgId: org.id,
    programs: TP_PROGRAMS[org.id] ?? [org.program],
  }));

  const backbones: DirectoryEntity[] = BACKBONES.map((org, index) => ({
    id: `bb-${org.id}`,
    role: "backbone",
    name: org.name,
    email: index === 0 ? "backbone@tester.com" : `${slug(org.name)}@backbone.s4g.test`,
    orgId: org.id,
  }));

  const liaisons: DirectoryEntity[] = EMPLOYMENT_LIAISONS.map((org, index) => ({
    id: `el-${org.id}`,
    role: "employment-liaison",
    name: org.name,
    email: index === 0 ? "liaison@tester.com" : `${slug(org.name)}@liaison.s4g.test`,
    orgId: org.id,
    employedCount: [14, 9, 11, 7, 16][index] ?? 8,
  }));

  return [
    {
      id: "admin-1",
      role: "admin",
      name: "Steps4Growth Administrator",
      email: "admin@tester.com",
    },
    {
      id: "pm-1",
      role: "project-manager",
      name: "NC A&T Project Office",
      email: "manager@tester.com",
    },
    ...trainingProviders,
    ...backbones,
    ...liaisons,
  ];
}

export function createDirectoryRepresentatives(): Representative[] {
  return [
    ...makeReps("pm-1", [
      ["Alicia Grant", "alicia.grant@s4g.test"],
      ["Marcus Hale", "marcus.hale@s4g.test"],
    ]),
    ...makeReps("tp-1", [
      ["Jordan Alvarez", "jordan.alvarez@s4g.test"],
      ["Miriam Stone", "miriam.stone@s4g.test"],
    ]),
    ...makeReps("tp-2", [["Priya Raman", "priya.raman@s4g.test"]]),
    ...makeReps("tp-3", [
      ["Carlos Bennett", "carlos.bennett@s4g.test"],
      ["Elena Cho", "elena.cho@s4g.test"],
      ["Nate Brooks", "nate.brooks@s4g.test"],
    ]),
    ...makeReps("tp-7", [
      ["Denise Harmon", "denise.harmon@s4g.test"],
      ["Will Harper", "will.harper@s4g.test"],
    ]),
    ...makeReps("tp-9", [["Chris Lang", "chris.lang@s4g.test"]]),
    ...makeReps("tp-12", [
      ["Imani Cole", "imani.cole@s4g.test"],
      ["Owen Briggs", "owen.briggs@s4g.test"],
      ["Sara Nguyen", "sara.nguyen@s4g.test"],
      ["Leo Patel", "leo.patel@s4g.test"],
    ]),
    ...makeReps("bb-16", [
      ["Keisha Monroe", "keisha.monroe@s4g.test"],
      ["David Ortiz", "david.ortiz@s4g.test"],
    ]),
    ...makeReps("bb-17", [["Hannah Wells", "hannah.wells@s4g.test"]]),
    ...makeReps("bb-19", [["Tom Reeves", "tom.reeves@s4g.test"]]),
    ...makeReps("el-20", [
      ["Nina Brooks", "nina.brooks@s4g.test"],
      ["Paul Kim", "paul.kim@s4g.test"],
    ]),
    ...makeReps("el-22", [["Rita Solano", "rita.solano@s4g.test"]]),
    ...makeReps("el-23", [
      ["Jamal Price", "jamal.price@s4g.test"],
      ["Becky Stone", "becky.stone@s4g.test"],
      ["Omar Díaz", "omar.diaz@s4g.test"],
    ]),
  ];
}
