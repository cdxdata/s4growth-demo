import { buildEdaWorkbookSheets, headerRows, type WorkbookSheet } from "@/adapters/edaWorkbook";
import type { AssembledQuarter } from "@/lib/quarterAssembler";
import type { PeriodSubmissionRecord } from "@/types/submissions";

export type { WorkbookHeaderGroup, WorkbookSheet } from "@/adapters/edaWorkbook";
export { buildEdaWorkbookSheets } from "@/adapters/edaWorkbook";

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

function excelSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[:\\/?*[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || "Sheet";
  let next = base;
  let suffix = 2;
  while (used.has(next.toLowerCase())) {
    const tail = ` ${suffix}`;
    next = `${base.slice(0, Math.max(1, 31 - tail.length))}${tail}`;
    suffix += 1;
  }
  used.add(next.toLowerCase());
  return next;
}

function sheetXml(rows: unknown[][], merges: string[] = []): string {
  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const cols = Array.from({ length: colCount }, (_, index) => {
    const width = Math.min(
      42,
      Math.max(14, ...rows.slice(0, 2).map((row) => String(row[index] ?? "").length + 2)),
    );
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
  }).join("");
  const content = rows
    .map((row, rowIndex) => {
      const cells = Array.from({ length: colCount }, (_, columnIndex) => {
        const value = row[columnIndex];
        const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
        if (value === undefined || value === "") {
          return `<c r="${ref}"/>`;
        }
        return typeof value === "number"
          ? `<c r="${ref}"><v>${value}</v></c>`
          : `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  const mergeXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData>${content}</sheetData>${mergeXml}</worksheet>`;
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

export function buildWorkbookBlob(sheets: WorkbookSheet[]): Blob {
  const usedNames = new Set<string>();
  const named = sheets.map((sheet, index) => ({
    name: excelSheetName(sheet.name, usedNames),
    xml: (() => {
      const header = headerRows(sheet.groups);
      return sheetXml([...header.rows, ...sheet.rows], header.merges);
    })(),
    sheetId: index + 1,
    rId: `rId${index + 1}`,
  }));

  const overrides = named
    .map(
      (sheet) =>
        `<Override PartName="/xl/worksheets/sheet${sheet.sheetId}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  const workbookSheets = named
    .map((sheet) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${sheet.sheetId}" r:id="${sheet.rId}"/>`)
    .join("");
  const rels = named
    .map(
      (sheet) =>
        `<Relationship Id="${sheet.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.sheetId}.xml"/>`,
    )
    .join("");

  return zipStore([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`,
    },
    ...named.map((sheet) => ({
      name: `xl/worksheets/sheet${sheet.sheetId}.xml`,
      content: sheet.xml,
    })),
  ]);
}

export const demoEdaSubmissionAdapter: EdaSubmissionAdapter = {
  async generate(input) {
    const sheets = buildEdaWorkbookSheets(input.records);
    const fileName = `steps4growth-${input.quarterLabel.toLowerCase().replace(/\s+/g, "-")}-eda.xlsx`;
    const href = URL.createObjectURL(buildWorkbookBlob(sheets));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(href);
    return {
      fileName,
      generatedAt: new Date().toLocaleString(),
      transmitted: false,
      rowCount: sheets.reduce((total, sheet) => total + sheet.rows.length, 0),
    };
  },
};
