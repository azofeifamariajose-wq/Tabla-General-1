
import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { SchemaDef, ExtractionItem, AuditItem, TokenUsage } from '../types';
import { generateContentWithRetry } from './apiWrapper';

// Model Definitions
const MODEL_FLASH = 'gemini-3-flash-preview';
const DEFAULT_THINKING_BUDGET = 1024;
const QA_THINKING_BUDGET = 2048;
const DEFAULT_MAX_OUTPUT_TOKENS = 12000;

const compactJson = (value: unknown) => JSON.stringify(value);
const AGENT_BLOCK_CHUNK_SIZE = 3;

const chunkBlocks = <T,>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64Data, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const mapUsage = (response: GenerateContentResponse): TokenUsage => {
  return {
    promptTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: response.usageMetadata?.totalTokenCount || 0
  };
};

const getSection14Reinforcement = (blockNumber: number): string => {
  if (blockNumber !== 14) return "";

  return `SECTION 14 REINFORCEMENT (CRITICAL):
  - This block has frequent extraction/audit errors. Apply an additional verification pass before finalizing.
  - Answer strictly from this PDF and schema instructions in constants.ts only; do not infer beyond explicit evidence.
  - For every question, re-check answer-question alignment and ensure option values exactly match allowed schema options when present.
  - If evidence is absent after exhaustive review, return "Not described" instead of guessing.`;
};

const normalizeSelectAnswersAndMissingGroups = <T extends ExtractionItem | AuditItem>(
  items: T[],
  schemaDef: SchemaDef
): T[] => {
  const questionDefs = new Map<string, { options?: string[] }>();
  for (const block of schemaDef.blocks) {
    for (const section of block.sections) {
      for (const question of section.questions) {
        questionDefs.set(question.label, { options: question.options });
      }
    }
  }

  // Detect number of comparative groups when explicitly reported.
  const comparativeCountItem = items.find(item =>
    item.question.toLowerCase().includes('number of compartive groups described') ||
    item.question.toLowerCase().includes('number of comparative groups described')
  );
  const comparativeCount = comparativeCountItem?.answer
    ? Number((comparativeCountItem.answer.match(/\d+/) || [])[0])
    : NaN;

  const absentGroups = new Set<number>();
  if (Number.isFinite(comparativeCount) && comparativeCount > 0) {
    for (let g = comparativeCount + 1; g <= 8; g++) {
      absentGroups.add(g);
    }
  }

  return items.map(item => {
    const normalized = { ...item };
    const answer = (normalized.answer || '').trim();
    const qMeta = questionDefs.get(item.question);
    const options = qMeta?.options || [];
    const allowsNA = options.some(opt => opt.toLowerCase() === 'n/a');

    if (answer && allowsNA) {
      const tokens = answer
        .split(/[;,|]/)
        .map(t => t.trim())
        .filter(Boolean);
      const hasNA = tokens.some(t => t.toLowerCase() === 'n/a');
      if (hasNA && tokens.length > 1) {
        normalized.answer = 'N/A';
      }
    }

    const questionLower = item.question.toLowerCase();
    for (const groupNumber of absentGroups) {
      const groupRegex = new RegExp(`\\bgroup\\s*${groupNumber}\\b`, 'i');
      if (groupRegex.test(questionLower) && allowsNA) {
        normalized.answer = 'N/A';
      }
    }

    if (Number.isFinite(comparativeCount) && comparativeCount < 4) {
      if (/groups?\s*4\s*or\s*more/i.test(item.question) && allowsNA) {
        normalized.answer = 'N/A';
      }
    }

    return normalized;
  });
};

// --- ROBUST JSON SANITIZER & REPAIR UTILS ---

/**
 * Repairs truncated JSON by closing unclosed strings, objects, and arrays.
 * Uses a stack to track open structures.
 */
const repairTruncatedJson = (json: string): string => {
  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];
  let result = json;

  for (let i = 0; i < result.length; i++) {
    const char = result[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') {
        stack.push('}');
      } else if (char === '[') {
        stack.push(']');
      } else if (char === '}' || char === ']') {
        // If we encounter a closer, pop the stack if it matches (naive check)
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  // 1. Close unclosed string
  if (inString) {
    result += '"';
  }

  // 2. Close unclosed structures in reverse order
  while (stack.length > 0) {
    result += stack.pop();
  }

  return result;
};

/**
 * Primary cleaning function.
 * 1. Removes Markdown.
 * 2. Fixes common backslash issues.
 * 3. Escapes unescaped newlines inside strings.
 * 4. Repairs truncation.
 */
const cleanJson = (text: string | undefined): string => {
  if (!text) return "[]";
  let cleaned = text.trim();
  
  // 1. Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // 2. Fix "Bad Unicode escape" and backslashes
  // Replace \xNN escapes (invalid in JSON) with \u00NN
  cleaned = cleaned.replace(/\\x([0-9A-Fa-f]{2})/g, "\\u00$1");
  // Fix invalid \u escapes
  cleaned = cleaned.replace(/\\u(?![0-9A-Fa-f]{4})/g, "\\\\u");
  // Escape backslashes that aren't valid escapes
  cleaned = cleaned.replace(/\\(?![/bfnrtu"\\\\]|u[0-9A-Fa-f]{4})/g, "\\\\");

  // 3. Handle unescaped newlines/tabs inside the JSON string (regex approximation)
  // This looks for newlines that are likely NOT structural (i.e., not followed by a key or closing brace)
  // A simple safe bet for single-line values often used in extraction:
  // We can replacing literal newlines with \n if they seem to be inside a string, 
  // but simpler is to rely on repairTruncatedJson to handle structural issues,
  // and here we just handle explicit control chars if they exist literally.
  // (Note: doing this robustly without a parser is hard, but we can try to fix standard LLM 'oopsies')
  
  // 4. Repair Truncation (Closing braces/quotes)
  cleaned = repairTruncatedJson(cleaned);

  return cleaned;
};

/**
 * Safe wrapper for JSON.parse with error logging.
 */
const safeJsonParse = <T>(jsonString: string | undefined, fallback: T): T => {
  const cleaned = cleanJson(jsonString);
  try {
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error("JSON Parse Error:", error.message);
    
    // Attempt to log position if available in error message
    const positionMatch = error.message.match(/position (\d+)/);
    if (positionMatch) {
      const pos = parseInt(positionMatch[1], 10);
      const start = Math.max(0, pos - 20);
      const end = Math.min(cleaned.length, pos + 20);
      console.error(`Error context: ...${cleaned.substring(start, end)}...`);
      console.error(`Problematic char: '${cleaned[pos]}'`);
    } else {
      console.error("Failed JSON content (snippet):", cleaned.substring(0, 100) + "...");
    }
    
    return fallback;
  }
};

// --- CORRELATION BRANCH (Normalization Addon) ---

const BRAND_CORRELATIONS: Record<string, string> = {
  "adacel": "Adacel®",
  "boostrix": "Boostrix®",
  "combe five": "ComBE Five®",
  "daptacel": "Daptacel®",
  "easyfive-tt": "Easyfive-TT®",
  "eupenta": "Eupenta®",
  "hexaxim": "Hexaxim®",
  "infanrix": "Infanrix®",
  "infanrix-ipv": "Infanrix®-IPV",
  "infanrix hexa": "Infanrix® Hexa",
  "infanrix penta": "Infanrix Penta®",
  "pediarix": "Pediarix®",
  "pentavac pfs": "Pentavac® PFS/SD",
  "pentavac sd": "Pentavac® PFS/SD",
  "pentavac": "Pentavac® PFS/SD",
  "pentacel": "Pentacel®",
  "pentaxim": "Pentaxim®",
  "pentalab": "Pentalab®",
  "quadracel": "Quadracel®",
  "quinvaxem": "Quinvaxem®",
  "tetraxim": "Tetraxim®",
  "tritanrix": "Tritanrix®",
  "vaxelis": "Vaxelis®"
};

const MANUFACTURER_CORRELATIONS: Record<string, string> = {
  "biological evans private limited": "Biological E. Limited",
  "glaxosmithkline": "GSK",
  "smithkline beecham biologicals": "GSK",
  "smithkline beecham": "GSK",
  "glaxo laboratories": "GSK",
  "glaxo holdings": "GSK",
  "smithkline beecham plc": "GSK",
  "glaxo wellcome plc": "GSK",
  "glaxosmithkline plc": "GSK",
  "gsk plc": "GSK",
  "lg chemical": "LG Chem Ltd.",
  "lak hui chemical industrial corp.": "LG Chem Ltd.",
  "lucky chemical industries co. ltd.": "LG Chem Ltd.",
  "lucky ltd.": "LG Chem Ltd.",
  "lg chem investment ltd.": "LG Chem Ltd.",
  "panacea biotec limited": "Panacea Biotec Ltd.",
  "panacea drugs private limited": "Panacea Biotec Ltd.",
  "radicura pharmaceuticals": "Panacea Biotec Ltd.",
  "radicura pharma": "Panacea Biotec Ltd.",
  "panacea biotec pharma": "Panacea Biotec Ltd.",
  "panacea biotec pharma limited": "Panacea Biotec Ltd.",
  "parc-vaccinogène": "PT Bio Farma (Persero)",
  "landskoepoek inrichting en instituut pasteur": "PT Bio Farma (Persero)",
  "bandung boeki kenkyusho": "PT Bio Farma (Persero)",
  "pn pasteur": "PT Bio Farma (Persero)",
  "pn bio farma": "PT Bio Farma (Persero)",
  "perum bio farma": "PT Bio Farma (Persero)",
  "institut pasteur": "Sanofi Pasteur",
  "pasteur vaccins": "Sanofi Pasteur",
  "pasteur mérieux connaught": "Sanofi Pasteur",
  "aventis pasteur": "Sanofi Pasteur",
  "sanofi": "Sanofi Pasteur",
  "serum institute of india private": "Serum Institute of India",
  "sii": "Serum Institute of India",
  "serum institute of india private limited": "Serum Institute of India"
};

/**
 * Applies correlation logic to extracted items.
 * Normalizes Brand Names and Manufacturer names based on strict interpretation rules.
 */
const applyCorrelationRules = (items: ExtractionItem[]): ExtractionItem[] => {
  return items.map(item => {
    const newItem = { ...item };
    if (!newItem.answer) return newItem;

    // Clean answer for matching (remove trademark symbols temporarily, lowercase, trim)
    const lowerAnswer = newItem.answer.toLowerCase().replace(/[®™]/g, '').trim();
    const lowerQuestion = item.question.toLowerCase();
    
    // 1. Check if question relates to Brand Name
    if (lowerQuestion.includes("brand") || lowerQuestion.includes("commercial name")) {
        // Sort keys by length descending to ensure "Pentavac PFS" is matched before "Pentavac"
        const sortedKeys = Object.keys(BRAND_CORRELATIONS).sort((a, b) => b.length - a.length);
        
        for (const key of sortedKeys) {
            // Check for containment. If the extracted answer contains the key, we map it.
            if (lowerAnswer.includes(key)) {
                newItem.answer = BRAND_CORRELATIONS[key];
                // Append logic note if changed
                if (newItem.answer !== item.answer) {
                    newItem.reasoning = (newItem.reasoning || "") + ` [Auto-Correlated: matched "${key}" -> normalized to "${BRAND_CORRELATIONS[key]}"]`;
                }
                break; // Stop after first match
            }
        }
    }

    // 2. Check if question relates to Manufacturer
    if (lowerQuestion.includes("manufacturer") || lowerQuestion.includes("pharmaceutical co")) {
         const sortedKeys = Object.keys(MANUFACTURER_CORRELATIONS).sort((a, b) => b.length - a.length);
         
         for (const key of sortedKeys) {
             if (lowerAnswer.includes(key)) {
                newItem.answer = MANUFACTURER_CORRELATIONS[key];
                if (newItem.answer !== item.answer) {
                    newItem.reasoning = (newItem.reasoning || "") + ` [Auto-Correlated: matched "${key}" -> normalized to "${MANUFACTURER_CORRELATIONS[key]}"]`;
                }
                break;
             }
         }
    }
    
    return newItem;
  });
};

// --- AGENTS ---

const EXTRACTION_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      block_id: { type: Type.NUMBER },
      section_name: { type: Type.STRING },
      question: { type: Type.STRING },
      answer: { type: Type.STRING },
      page_number: { type: Type.STRING },
      reasoning: { type: Type.STRING },
    },
    required: ["block_id", "section_name", "question", "answer", "page_number", "reasoning"],
  },
};

const AUDIT_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      block_id: { type: Type.NUMBER },
      section_name: { type: Type.STRING },
      question: { type: Type.STRING },
      answer: { type: Type.STRING },
      page_number: { type: Type.STRING },
      reasoning: { type: Type.STRING },
      status: { type: Type.STRING, enum: ["VERIFIED", "CORRECTED"] },
      original_answer: { type: Type.STRING },
      auditor_notes: { type: Type.STRING },
    },
    required: ["block_id", "section_name", "question", "answer", "page_number", "reasoning", "status", "auditor_notes"],
  },
};

const QA_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        block_id: { type: Type.NUMBER },
        section_name: { type: Type.STRING },
        question: { type: Type.STRING },
        answer: { type: Type.STRING },
        page_number: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["VERIFIED", "CORRECTED"] },
        original_answer: { type: Type.STRING },
        auditor_notes: { type: Type.STRING },
        qa_status: { type: Type.STRING, enum: ["PASSED", "FIXED"] },
        qa_notes: { type: Type.STRING }
      },
      required: ["block_id", "section_name", "question", "answer", "page_number", "reasoning", "status", "auditor_notes", "qa_status", "qa_notes"],
    },
  };

/**
 * AGENT 4: ISOLATION SUPERVISOR
 */
export const runSupervisorAgent = async (
    file: File,
    mode: 'PRE' | 'POST',
    currentResults?: AuditItem[],
 ): Promise<{result: string, usage: TokenUsage}> => {
    if (!process.env.API_KEY) throw new Error("API Key is missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const filePart = await fileToPart(file);

    const prompt = mode === 'PRE' 
        ? `You are the ISOLATION SUPERVISOR (Agent 4).
           A new clinical document is being processed: "${file.name}".
           TASK: Analyze the first 2 pages of this document. Identify the UNIQUE STUDY ID, TITLE, or authors.
           Declare a "Strict Context Boundary". 
           From this point on, you must reject any information that does not belong to THIS specific study.
           OUTPUT: A short declaration of isolation for this document.`
        : `You are the ISOLATION SUPERVISOR (Agent 4).
           Current Document: "${file.name}".
           TASK: Review the final results generated by the pipeline.
           Ensure that 100% of the data in the results below corresponds ONLY to document "${file.name}".
           If you detect any data from other files or hallucinations, flag it.
           RESULTS TO VERIFY:
           ${compactJson(currentResults)}
           OUTPUT: "ISOLATION VERIFIED" or a list of contamination errors.`;

    // Agent 4 uses Flash for speed on isolation checks
    const response = await generateContentWithRetry(ai, MODEL_FLASH, {
        contents: { parts: [filePart, { text: prompt }] },
        config: { thinkingConfig: { thinkingBudget: DEFAULT_THINKING_BUDGET } }
    });

    return { result: response.text || "Isolation Check Failed", usage: mapUsage(response) };
};

export const runExtractionAgent = async (
  file: File, 
  schemaDef: SchemaDef, 
  onProgress: (current: number, total: number) => void
): Promise<{items: ExtractionItem[], usage: TokenUsage}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const filePart = await fileToPart(file);
  const blockChunks = chunkBlocks(schemaDef.blocks, AGENT_BLOCK_CHUNK_SIZE);
  const allItems: ExtractionItem[] = [];
  let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

  for (let i = 0; i < blockChunks.length; i++) {
    const chunk = blockChunks[i];
    const chunkSchema = { ...schemaDef, blocks: chunk };
    
    // Check if the current chunk contains Block 14 (Vaccine Characteristics)
    const hasBlock14 = chunk.some(b => b.block_number === 14);
    const reinforcement = hasBlock14 ? getSection14Reinforcement(14) : "";

    const prompt = `EXPERT MEDICAL EXTRACTOR. File: ${file.name}.
    STRICT RULE: ONLY EXTRACT FROM THIS FILE. DO NOT USE PRIOR KNOWLEDGE.
    INSTRUCTION SOURCE OF TRUTH: Follow only the constraints/instructions defined in constants.ts via the schema below.
    ${reinforcement}
    OUTPUT FORMAT: Return a valid JSON array matching the schema.
    PROCESS THESE BLOCKS IN ORDER: ${compactJson(chunk.map(b => ({ block_number: b.block_number, block_name: b.block_name })))}
    SCHEMA: ${compactJson(chunkSchema)}`;

    const response = await generateContentWithRetry(ai, MODEL_FLASH, {
      contents: { parts: [filePart, { text: prompt }] },
      config: { 
          responseMimeType: "application/json", 
          responseSchema: EXTRACTION_SCHEMA,
          thinkingConfig: { thinkingBudget: DEFAULT_THINKING_BUDGET },
          maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS 
      }
    });

    const chunkItems = safeJsonParse<ExtractionItem[]>(response.text || "[]", []);
    allItems.push(...chunkItems);

    const usage = mapUsage(response);
    totalUsage.promptTokens += usage.promptTokens;
    totalUsage.outputTokens += usage.outputTokens;
    totalUsage.totalTokens += usage.totalTokens;

    onProgress(i + 1, blockChunks.length);
  }

  // --- APPLY CORRELATION BRANCH ADDON ---
  // Normalizes brands and manufacturers before returning results
  // const correlatedItems = applyCorrelationRules(allItems); // Correlation turned off per request
  
  // Apply Group Normalization (N/A for missing groups)
  const finalItems = normalizeSelectAnswersAndMissingGroups(allItems, schemaDef);

  return { items: finalItems, usage: totalUsage };
};

export const runAuditAgent = async (
  file: File, 
  originalData: ExtractionItem[], 
  schemaDef: SchemaDef,
  onProgress: (current: number, total: number) => void
): Promise<{items: AuditItem[], usage: TokenUsage}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const filePart = await fileToPart(file);
    const itemsByBlock = originalData.reduce((acc, item) => {
        const bid = item.block_id || 0;
        if (!acc[bid]) acc[bid] = [];
        acc[bid].push(item);
        return acc;
    }, {} as Record<number, ExtractionItem[]>);

    const blockChunks = chunkBlocks(schemaDef.blocks, AGENT_BLOCK_CHUNK_SIZE);
    const auditedItems: AuditItem[] = [];
    let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

    for (let i = 0; i < blockChunks.length; i++) {
        const chunk = blockChunks[i];
        const chunkData = chunk.flatMap(block => itemsByBlock[block.block_number] || []);
        
        // Check if the current chunk contains Block 14 (Vaccine Characteristics)
        const hasBlock14 = chunk.some(b => b.block_number === 14);
        const reinforcement = hasBlock14 ? getSection14Reinforcement(14) : "";

        const prompt = `STRICT MEDICAL AUDITOR. File: ${file.name}.
        Review all provided blocks and return one JSON array.
        MANDATES: enforce answer-question alignment, no blanks (use "N/A" only if truly absent), exact constants/options, schema order, and for multi-select questions include ALL applicable options separated by semicolons.
        INSTRUCTION SOURCE OF TRUTH: Use only constraints/instructions defined in constants.ts through the SCHEMA BLOCKS.
        ${reinforcement}
        OUTPUT FORMAT: Return a valid JSON array matching the schema.
        SCHEMA BLOCKS: ${compactJson(chunk)}
        CURRENT DATA: ${compactJson(chunkData)}`;

        const response = await generateContentWithRetry(ai, MODEL_FLASH, {
            contents: { parts: [filePart, { text: prompt }] },
            config: { 
              responseMimeType: "application/json", 
              responseSchema: AUDIT_SCHEMA, 
              thinkingConfig: { thinkingBudget: DEFAULT_THINKING_BUDGET },
              maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS 
            }
        });
        
        const result = safeJsonParse<AuditItem[]>(response.text || "[]", []);
        auditedItems.push(...result);

        const usage = mapUsage(response);
        totalUsage.promptTokens += usage.promptTokens;
        totalUsage.outputTokens += usage.outputTokens;
        totalUsage.totalTokens += usage.totalTokens;

        onProgress(i + 1, blockChunks.length);
    }
    
    const normalizedAuditedItems = normalizeSelectAnswersAndMissingGroups(auditedItems, schemaDef);
    return { items: normalizedAuditedItems, usage: totalUsage };
  };

export const runQAAgent = async (
    file: File,
    auditedData: AuditItem[],
    schemaDef: SchemaDef,
    onProgress: (current: number, total: number) => void
): Promise<{items: AuditItem[], usage: TokenUsage}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const filePart = await fileToPart(file);
    const finalQAItems: AuditItem[] = [];
    let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

    const auditedByBlock = auditedData.reduce((acc, item) => {
        const bid = item.block_id || 0;
        if (!acc[bid]) acc[bid] = [];
        acc[bid].push(item);
        return acc;
    }, {} as Record<number, AuditItem[]>);

    const blockChunks = chunkBlocks(schemaDef.blocks, AGENT_BLOCK_CHUNK_SIZE);

    for (let i = 0; i < blockChunks.length; i++) {
        const chunk = blockChunks[i];
        const chunkData = chunk.flatMap(block => auditedByBlock[block.block_number] || []);
        
        // Check if the current chunk contains Block 14 (Vaccine Characteristics)
        const hasBlock14 = chunk.some(b => b.block_number === 14);
        const reinforcement = hasBlock14 ? getSection14Reinforcement(14) : "";

        const prompt = `FINAL QA AUTHORITY. File: ${file.name}.
        Validate these blocks for CSV integrity and return one JSON array.
        RULES: exact schema order, no missing fields, fill missing answers with "N/A", and for multi-select return all applicable options separated by semicolons.
        INSTRUCTION SOURCE OF TRUTH: Validate using only constraints/instructions defined in constants.ts through the SCHEMA BLOCKS.
        ${reinforcement}
        SCHEMA BLOCKS: ${compactJson(chunk)}
        AUDITED DATA: ${compactJson(chunkData)}`;

        const response = await generateContentWithRetry(ai, MODEL_FLASH, {
            contents: { parts: [filePart, { text: prompt }] },
            config: { 
              responseMimeType: "application/json", 
              responseSchema: QA_SCHEMA, 
              thinkingConfig: { thinkingBudget: QA_THINKING_BUDGET },
              maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS 
            }
        });
        
        const result = safeJsonParse<AuditItem[]>(response.text || "[]", []);
        finalQAItems.push(...result);

        const usage = mapUsage(response);
        totalUsage.promptTokens += usage.promptTokens;
        totalUsage.outputTokens += usage.outputTokens;
        totalUsage.totalTokens += usage.totalTokens;

        onProgress(i + 1, blockChunks.length);
    }
    
    const normalizedQAItems = normalizeSelectAnswersAndMissingGroups(finalQAItems, schemaDef);
    return { items: normalizedQAItems, usage: totalUsage };
};

export const runExportValidationAgent = async (
  file: File,
  qaData: AuditItem[],
  schemaDef: SchemaDef,
  onProgress: (current: number, total: number) => void
): Promise<{items: AuditItem[], usage: TokenUsage}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const filePart = await fileToPart(file);
  const validatedItems: AuditItem[] = [];
  let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

  const dataByBlock = qaData.reduce((acc, item) => {
      const bid = item.block_id || 0;
      if (!acc[bid]) acc[bid] = [];
      acc[bid].push(item);
      return acc;
  }, {} as Record<number, AuditItem[]>);

  const blockChunks = chunkBlocks(schemaDef.blocks, AGENT_BLOCK_CHUNK_SIZE);

  for (let i = 0; i < blockChunks.length; i++) {
      const chunk = blockChunks[i];
      const chunkData = chunk.flatMap(block => dataByBlock[block.block_number] || []);

      // Check if the current chunk contains Block 14 (Vaccine Characteristics)
      const hasBlock14 = chunk.some(b => b.block_number === 14);
      const reinforcement = hasBlock14 ? getSection14Reinforcement(14) : "";

      const prompt = `EXPORT VALIDATION AGENT. File: ${file.name}.
      Guarantee export integrity for all provided blocks.
      RULES: 1:1 mapping, exact question order, no blanks, keep values unless fixing structural/blank issues.
      INSTRUCTION SOURCE OF TRUTH: Enforce only constraints/instructions defined in constants.ts through the SCHEMA BLOCKS.
      ${reinforcement}
      SCHEMA BLOCKS: ${compactJson(chunk)}
      CANDIDATE DATA: ${compactJson(chunkData)}`;

      const response = await generateContentWithRetry(ai, MODEL_FLASH, {
          contents: { parts: [filePart, { text: prompt }] },
          config: { 
            responseMimeType: "application/json", 
            responseSchema: QA_SCHEMA,
            thinkingConfig: { thinkingBudget: DEFAULT_THINKING_BUDGET },
            maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS 
          }
      });
      
      const result = safeJsonParse<AuditItem[]>(response.text || "[]", []);
      validatedItems.push(...result);

      const usage = mapUsage(response);
      totalUsage.promptTokens += usage.promptTokens;
      totalUsage.outputTokens += usage.outputTokens;
      totalUsage.totalTokens += usage.totalTokens;

      onProgress(i + 1, blockChunks.length);
  }
  
  const normalizedValidatedItems = normalizeSelectAnswersAndMissingGroups(validatedItems, schemaDef);
  return { items: normalizedValidatedItems, usage: totalUsage };
};
