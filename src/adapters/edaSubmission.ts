import type { AssembledQuarter } from "@/lib/quarterAssembler";
import type { PeriodSubmissionRecord } from "@/types/submissions";

export type EdaExportInput = {
  quarterLabel: string;
  providerName: string;
  records: Record<string, PeriodSubmissionRecord>;
  draft: AssembledQuarter;
};

export type EdaExportConfirmation = {
  fileName: string;
  generatedAt: string;
  transmitted: false;
  rowCount: number;
};

export interface EdaSubmissionAdapter {
  generate(input: EdaExportInput): Promise<EdaExportConfirmation>;
}

function escapeXml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function columnName(index: number): string {
  let result = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
}

function sheetXml(rows: unknown[][]): string {
  const content = rows.map((row, rowIndex) =>
    `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      return typeof value === "number"
        ? `<c r="${ref}"><v>${value}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
    }).join("")}</row>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${content}</sheetData></worksheet>`;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files: Array<{ name: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const view = (size: number) => new DataView(new ArrayBuffer(size));

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = view(30);
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(local.buffer), name, data);

    const entry = view(46);
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((size, chunk) => size + chunk.length, 0);
  const end = view(22);
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function buildWorkbookBlob(summaryRows: Array<Record<string, string | number>>, narrativeRows: unknown[][]): Blob {
  const headers = Object.keys(summaryRows[0] ?? {});
  const summary = [headers, ...summaryRows.map((row) => headers.map((key) => row[key]))];
  return zipStore([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Summary Sheet" sheetId="1" r:id="rId1"/><sheet name="PPR Draft" sheetId="2" r:id="rId2"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>` },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml(summary) },
    { name: "xl/worksheets/sheet2.xml", content: sheetXml(narrativeRows) },
  ]);
}

function n(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values: Array<string | undefined>): number {
  return values.reduce<number>((total, value) => total + n(value), 0);
}

export function buildEdaSummaryRows(input: EdaExportInput): Array<Record<string, string | number>> {
  const monthly = Object.values(input.records);
  const admissions = monthly.flatMap((record) => record.eda.admissions);
  const completions = monthly.flatMap((record) => record.eda.completions);
  const nonCompletions = monthly.flatMap((record) => record.eda.nonCompletions);
  const employment = monthly.flatMap((record) => record.eda.employmentType);
  const earn = monthly.flatMap((record) => record.eda.earnAndLearn);
  const salaries = monthly.flatMap((record) => record.eda.salaries);
  const status = monthly.flatMap((record) => record.eda.employmentStatus);
  const institutional = monthly.flatMap((record) => record.eda.institutional);
  const program = monthly.flatMap((record) => record.eda.trainingPrograms).find(Boolean) ?? "Advanced Manufacturing";

  return [{
    sect_part: monthly[0]?.eda.sectoralPartnership ?? "",
    tp_name: input.providerName,
    tp_program: program,
    tp_length: institutional.find((row) => row.programLength)?.programLength ?? "",
    tp_enviornment: institutional.find((row) => row.environmentType)?.environmentType ?? "",
    tp_hours: institutional.find((row) => row.programHours.length)?.programHours.join("; ") ?? "",
    tp_soft_skill: institutional.find((row) => row.softSkillTraining)?.softSkillTraining ?? "",
    tp_program_cost: institutional.find((row) => row.tuitionCost)?.tuitionCost ?? "",
    tp_credential: institutional.find((row) => row.credentialType)?.credentialType ?? "",
    part_recruit: sum(admissions.map((row) => row.recruited)),
    part_admit: sum(admissions.map((row) => row.admitted)),
    part_enroll: input.draft.enrolled,
    part_comp: input.draft.completions,
    part_not_continuous: sum(completions.map((row) => row.completedNotContinuous)),
    part_no_complete: sum(nonCompletions.map((row) => row.didNotComplete)),
    part_no_comp_trans: sum(nonCompletions.map((row) => row.reasons.transportation)),
    part_no_comp_childcare: sum(nonCompletions.map((row) => row.reasons.childcare)),
    part_no_comp_finoblig: sum(nonCompletions.map((row) => row.reasons.financialObligations)),
    employ_fte: sum(employment.map((row) => row.types.fullTime)),
    employ_part: sum(employment.map((row) => row.types.partTime)),
    employ_season: sum(employment.map((row) => row.types.seasonal)),
    employ_earn_learn: sum(employment.map((row) => row.types.earnAndLearn)),
    employ_other: sum(employment.map((row) => row.types.other)),
    el_reg_appren: sum(earn.map((row) => row.models.registeredApprenticeship)),
    el_nonreg_appren: sum(earn.map((row) => row.models.nonRegisteredApprenticeship)),
    el_intern: sum(earn.map((row) => row.models.internship)),
    el_cust_train: sum(earn.map((row) => row.models.customizedTraining)),
    med_salary_fte: salaries.find((row) => row.medians.fullTime)?.medians.fullTime ?? "0",
    med_salary_pt: salaries.find((row) => row.medians.partTime)?.medians.partTime ?? "0",
    perc_report: salaries.find((row) => row.reportedPercent)?.reportedPercent ?? "0",
    employ_infield: sum(status.map((row) => row.statuses.partnerInField)),
    employ_infield_nopart: sum(status.map((row) => row.statuses.nonPartnerInField)),
    employ_seek: sum(status.map((row) => row.statuses.stillSeeking)),
    employ_no_seek: sum(status.map((row) => row.statuses.notSeeking)),
    employ_nocontact: sum(status.map((row) => row.statuses.couldNotContact)),
    top_three_occup: status.find((row) => row.topOccupations)?.topOccupations ?? "",
    top_three_employers: status.find((row) => row.topEmployers)?.topEmployers ?? "",
  }];
}

export const demoEdaSubmissionAdapter: EdaSubmissionAdapter = {
  async generate(input) {
    const summaryRows = buildEdaSummaryRows(input);
    const narrativeRows = [
      ["Steps4Growth Quarterly Draft", input.quarterLabel],
      ["Provider", input.providerName],
      ["Monthly sources", input.draft.sources.map((source) => `${source.label}: ${source.status}`).join("; ")],
      [],
      ["Achievements", input.draft.achievements],
      ["Challenges", input.draft.challenges],
      ["Action plan", input.draft.plan],
      ["Success story", input.draft.quote],
    ];
    const fileName = `steps4growth-${input.quarterLabel.toLowerCase().replace(/\s+/g, "-")}-eda.xlsx`;
    const href = URL.createObjectURL(buildWorkbookBlob(summaryRows, narrativeRows));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(href);
    return {
      fileName,
      generatedAt: new Date().toLocaleString(),
      transmitted: false,
      rowCount: summaryRows.length,
    };
  },
};
