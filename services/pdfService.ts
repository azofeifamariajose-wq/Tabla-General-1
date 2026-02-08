
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MEDICAL_SCHEMA } from '../constants';
import { FileResult } from '../types';

/**
 * Generates a PDF report for a single file result.
 * Strictly adheres to the Master Template order and logic.
 */
export const generateExtractionReport = (result: FileResult) => {
  const doc = new jsPDF();

  // --- Header Metadata ---
  doc.setFontSize(18);
  doc.text("Extraction & Audit Report", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Source PDF: ${result.fileName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);
  doc.text(`Pipeline Status: ${result.status.toUpperCase()}`, 14, 40);
  // doc.text(`Run ID: ${result.id || 'N/A'}`, 14, 45); // Optional if ID exists

  // --- Data Preparation ---
  const tableData: any[][] = [];

  // Helper for normalization (Must match App.tsx logic for consistency)
  const normalizeText = (value?: string) =>
    value ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';

  // Iterate strictly through the Schema to preserve order
  MEDICAL_SCHEMA.blocks.forEach(block => {
    block.sections.forEach(section => {
      section.questions.forEach(q => {
        // Find the matching answer in the extracted results
        // STRICT MATCHING LOGIC (Same as Excel Export)
        const normalizedSection = normalizeText(section.section_name);
        const blockItems = result.results.filter(r => {
          const matchesBlock = String(r.block_id) === String(block.block_number);
          const matchesSection = normalizeText(r.section_name) === normalizedSection;
          return matchesBlock && matchesSection;
        });

        // 1. Priority: Exact Label Match (Trimmed)
        const normalizedLabel = normalizeText(q.label);
        let item = blockItems.find(r => normalizeText(r.question) === normalizedLabel);

        // 2. Fallback: Exact Key Match
        if (!item && q.key) {
           item = blockItems.find(r => normalizeText(r.question) === normalizeText(q.key));
        }

        // 3. Fallback: Key inside Question
        if (!item && q.key) {
          item = blockItems.find(r => normalizeText(r.question).includes(normalizeText(q.key)));
        }

        // --- Row Construction ---
        // Fields: PDF Name | Question ID | Question | Answer | Explanation | Page | Reviewed By
        const row = [
          result.fileName,                          // PDF Name
          q.key || "N/A",                           // Question ID/Key
          q.label,                                  // Question
          item ? item.answer : "N/A",               // Answer (Final Approved)
          item ? item.reasoning : "N/A",            // Explanation
          item ? item.page_number : "N/A",          // Page of Extraction
          "Export Validation Agent"                 // Reviewed By (Fixed to Final Gatekeeper)
        ];

        tableData.push(row);
      });
    });
  });

  // --- Table Generation ---
  autoTable(doc, {
    startY: 50,
    head: [[
      "PDF Name",
      "Key",
      "Question",
      "Answer",
      "Explanation",
      "Page",
      "Reviewed By"
    ]],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [63, 81, 181], // Indigo-700
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 20 }, // PDF Name
      1: { cellWidth: 20 }, // Key
      2: { cellWidth: 40 }, // Question
      3: { cellWidth: 30 }, // Answer
      4: { cellWidth: 40 }, // Explanation
      5: { cellWidth: 15 }, // Page
      6: { cellWidth: 25 }  // Reviewed By
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: { top: 20 }
  });

  // Save the PDF
  doc.save(`${result.fileName.replace('.pdf', '')}_Extraction_Report.pdf`);
};
