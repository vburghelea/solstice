#!/usr/bin/env node
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat } from 'docx';
import { readFileSync, writeFileSync } from 'fs';

const inputPath = '/Users/austin/dev/solstice/docs/sin-rfp/response/asvs-5-controls-matrix.md';
const outputPath = '/Users/austin/dev/solstice/docs/sin-rfp/response/asvs-5-controls-matrix.docx';

const markdown = readFileSync(inputPath, 'utf8');
const lines = markdown.split('\n');

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

// Column widths (total ~14400 DXA for letter with 0.5" margins)
const colWidths = [900, 700, 5000, 1200, 3000, 3600]; // Control, Level, Requirement, Status, Evidence, Notes

function parseMarkdownTable(tableLines) {
  const rows = [];
  for (const line of tableLines) {
    if (line.includes('---')) continue; // Skip separator
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

function createTableRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map((text, i) => new TableCell({
      borders: cellBorders,
      width: { size: colWidths[i] || 2000, type: WidthType.DXA },
      shading: isHeader ? { fill: 'D5E8F0', type: ShadingType.CLEAR } : undefined,
      children: [new Paragraph({
        children: [new TextRun({ text: text || '', bold: isHeader, size: isHeader ? 20 : 18 })],
      })]
    }))
  });
}

function createTable(rows) {
  if (rows.length === 0) return null;
  return new Table({
    columnWidths: colWidths,
    rows: [
      createTableRow(rows[0], true),
      ...rows.slice(1).map(r => createTableRow(r))
    ]
  });
}

// Parse document
const children = [];
let currentTableLines = [];
let inTable = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Title
  if (line.startsWith('# ') && !line.startsWith('## ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      children: [new TextRun({ text: line.slice(2), bold: true, size: 32 })]
    }));
    continue;
  }

  // Section heading
  if (line.startsWith('## ')) {
    // Flush any pending table
    if (currentTableLines.length > 0) {
      const rows = parseMarkdownTable(currentTableLines);
      const table = createTable(rows);
      if (table) children.push(table);
      currentTableLines = [];
      inTable = false;
    }
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      children: [new TextRun({ text: line.slice(3), bold: true, size: 24 })]
    }));
    continue;
  }

  // Table row
  if (line.startsWith('|')) {
    inTable = true;
    currentTableLines.push(line);
    continue;
  }

  // End of table
  if (inTable && !line.startsWith('|')) {
    const rows = parseMarkdownTable(currentTableLines);
    const table = createTable(rows);
    if (table) children.push(table);
    currentTableLines = [];
    inTable = false;
  }

  // Regular text (metadata, legend, etc.)
  if (line.trim() && !line.startsWith('|')) {
    // Bullet points
    if (line.startsWith('- ')) {
      children.push(new Paragraph({
        numbering: { reference: 'bullet-list', level: 0 },
        children: [new TextRun({ text: line.slice(2), size: 20 })]
      }));
    } else if (line.match(/^(Legend|Scope|Last updated)/)) {
      children.push(new Paragraph({
        spacing: { before: 100, after: 50 },
        children: [new TextRun({ text: line, bold: true, size: 20 })]
      }));
    } else if (line.trim()) {
      children.push(new Paragraph({
        children: [new TextRun({ text: line, size: 20 })]
      }));
    }
  }
}

// Flush final table
if (currentTableLines.length > 0) {
  const rows = parseMarkdownTable(currentTableLines);
  const table = createTable(rows);
  if (table) children.push(table);
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal',
        run: { size: 32, bold: true, font: 'Arial' },
        paragraph: { spacing: { after: 200 }, alignment: AlignmentType.CENTER } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal',
        run: { size: 24, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 300, after: 150 } } }
    ]
  },
  numbering: {
    config: [{
      reference: 'bullet-list',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  sections: [{
    properties: {
      page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }
    },
    children
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(outputPath, buffer);
console.log(`Created: ${outputPath}`);
