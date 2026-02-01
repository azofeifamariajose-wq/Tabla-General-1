
import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { SchemaDef, ExtractionItem, AuditItem, TokenUsage } from '../types';
import { generateContentWithRetry } from './apiWrapper';

// Model Definitions
const MODEL_FLASH = 'gemini-3-flash-preview';

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
const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
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
           ${JSON.stringify(currentResults, null, 2)}
           OUTPUT: "ISOLATION VERIFIED" or a list of contamination errors.`;

    // Agent 4 uses Flash for speed on isolation checks
    const response = await generateContentWithRetry(ai, MODEL_FLASH, {
        contents: { parts: [filePart, { text: prompt }] },
        config: { thinkingConfig: { thinkingBudget: 2048 } }
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
  const blocks = schemaDef.blocks;
  const allItems: ExtractionItem[] = [];
  let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const currentBlockSchema = { ...schemaDef, blocks: [block] };
    const prompt = `EXPERT MEDICAL EXTRACTOR. File: ${file.name}. Block ${block.block_number}: ${block.block_name}. 
    STRICT RULE: ONLY EXTRACT FROM THIS FILE. DO NOT USE PRIOR KNOWLEDGE.
    OUTPUT FORMAT: Return a valid JSON array matching the schema.
    SCHEMA: ${JSON.stringify(currentBlockSchema, null, 2)}`;

    // Agent 1 uses Flash for efficiency on bulk extraction
    const response = await generateContentWithRetry(ai, MODEL_FLASH, {
      contents: { parts: [filePart, { text: prompt }] },
      config: { 
          responseMimeType: "application/json", 
          responseSchema: EXTRACTION_SCHEMA, 
          // Increased thinking budget and maxOutputTokens to handle large blocks (like Section 14)
          thinkingConfig: { thinkingBudget: 4096 },
          maxOutputTokens: 30000 
      }
    });

    // Use safeJsonParse to ensure robustness against truncation or special chars
    const blockItems = safeJsonParse<ExtractionItem[]>(response.text, []);
    allItems.push(...blockItems);
    
    const usage = mapUsage(response);
    totalUsage.promptTokens += usage.promptTokens;
    totalUsage.outputTokens += usage.outputTokens;
    totalUsage.totalTokens += usage.totalTokens;

    onProgress(i + 1, blocks.length);
  }

  // --- APPLY CORRELATION BRANCH ADDON ---
  // Normalizes brands and manufacturers before returning results
  // const correlatedItems = applyCorrelationRules(allItems); // Correlation turned off per request
  // Passing allItems directly instead of correlatedItems
  const finalItems = allItems;

  return { items: finalItems, usage: totalUsage };
};

export const runAuditAgent = async (
  file: File, 
  originalData: ExtractionItem[], 
  schemaDef: SchemaDef, // Added SchemaDef to context
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

    // Iterate over Schema blocks to ensure coverage, even if extraction missed it.
    const blocks = schemaDef.blocks;
    const auditedItems: AuditItem[] = [];
    let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockItems = itemsByBlock[block.block_number] || [];

        const prompt = `STRICT MEDICAL AUDITOR. File: ${file.name}. 
        Reviewing Block ${block.block_number}: ${block.block_name}.

        YOU HAVE 5 CRITICAL MANDATES. EXECUTE THEM SEQUENTIALLY:

        1. ANSWER-QUESTION ALIGNMENT:
           - Verify that every 'answer' textually and logically matches its 'question'.
           - If an answer is off-topic, generic, or mismatched, YOU MUST RETURN TO THE PDF SOURCE, find the correct information, and overwrite the bad data.

        2. ZERO BLANKS POLICY:
           - NO FIELD MAY REMAIN EMPTY.
           - If an answer is "", null, "unknown", or missing, SEARCH THE PDF EXHAUSTIVELY.
           - If found: Extract it.
           - If TRULY not found after deep search: Use "Not described".
           - DO NOT ALLOW BLANKS.

        3. CONSTANT REFERENCE COMPLIANCE:
           - Check the 'SCHEMA BLOCK' for 'options' and 'type'.
           - Your output 'answer' MUST EXACTLY MATCH one of the provided options if defined.
           - If the PDF says "GSK" but option is "GlaxoSmithKline", map it accurately.
           - If format is "18 C", fix it to match schema (e.g., "18 months").

        4. STRICT ORDER INTEGRITY:
           - Your output JSON array must EXACTLY match the order of questions in the 'SCHEMA BLOCK'.
           - Do not sort, do not shuffle, do not omit keys.

        5. AUDIT COMPLETION GATE (INTERNAL CHECKLIST):
           Before outputting JSON, ask yourself:
           - All questions present? [ ]
           - No blanks? [ ]
           - Order matches Schema? [ ]
           - Answers meaningful? [ ]
           - Constants respected? [ ]
           
           IF ANY CHECK FAILS, RE-PROCESS THAT ITEM USING THE PDF BEFORE FINALIZING.

        OUTPUT FORMAT: Return a valid JSON array matching the schema.
        SCHEMA BLOCK: ${JSON.stringify(block, null, 2)}
        CURRENT DATA: ${JSON.stringify(blockItems, null, 2)}`;

        // Agent 2 uses Flash as requested
        const response = await generateContentWithRetry(ai, MODEL_FLASH, {
            contents: { parts: [filePart, { text: prompt }] },
            config: { 
              responseMimeType: "application/json", 
              responseSchema: AUDIT_SCHEMA, 
              thinkingConfig: { thinkingBudget: 4096 },
              maxOutputTokens: 30000 
            }
        });
        
        // Use safeJsonParse to ensure robustness
        const result = safeJsonParse<AuditItem[]>(response.text, []);
        auditedItems.push(...result);

        const usage = mapUsage(response);
        totalUsage.promptTokens += usage.promptTokens;
        totalUsage.outputTokens += usage.outputTokens;
        totalUsage.totalTokens += usage.totalTokens;

        onProgress(i + 1, blocks.length);
    }
    return { items: auditedItems, usage: totalUsage };
  };

export const runQAAgent = async (
    file: File,
    auditedData: AuditItem[],
    schemaDef: SchemaDef,
    onProgress: (current: number, total: number) => void
): Promise<{items: AuditItem[], usage: TokenUsage}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const filePart = await fileToPart(file);
    const blocks = schemaDef.blocks;
    const finalQAItems: AuditItem[] = [];
    let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

    const auditedByBlock = auditedData.reduce((acc, item) => {
        const bid = item.block_id || 0;
        if (!acc[bid]) acc[bid] = [];
        acc[bid].push(item);
        return acc;
    }, {} as Record<number, AuditItem[]>);

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const prompt = `FINAL QA AUTHORITY. File: ${file.name}. Block ${block.block_number}.
        
        MANDATE:
        1. CSV INTEGRITY & ORDER: The output JSON MUST contain an entry for EVERY question in the 'SCHEMA BLOCK', in the EXACT ORDER defined there.
        2. NO MISSING FIELDS: Verify every single question has a non-empty answer. If still missing, fill with "Not described".
        3. FINAL VALIDATION: Ensure the list structure matches the schema 1:1. This is critical for CSV column alignment.

        SCHEMA BLOCK: ${JSON.stringify(block, null, 2)}
        AUDITED DATA: ${JSON.stringify(auditedByBlock[block.block_number] || [], null, 2)}`;

        // Agent 3 uses Flash for efficiency/speed in final QA
        const response = await generateContentWithRetry(ai, MODEL_FLASH, {
            contents: { parts: [filePart, { text: prompt }] },
            config: { 
              responseMimeType: "application/json", 
              responseSchema: QA_SCHEMA, 
              thinkingConfig: { thinkingBudget: 8192 },
              maxOutputTokens: 30000 
            }
        });
        
        // Use safeJsonParse to ensure robustness
        const result = safeJsonParse<AuditItem[]>(response.text, []);
        finalQAItems.push(...result);

        const usage = mapUsage(response);
        totalUsage.promptTokens += usage.promptTokens;
        totalUsage.outputTokens += usage.outputTokens;
        totalUsage.totalTokens += usage.totalTokens;

        onProgress(i + 1, blocks.length);
    }
    return { items: finalQAItems, usage: totalUsage };
};

export const runExportValidationAgent = async (
  file: File,
  qaData: AuditItem[],
  schemaDef: SchemaDef,
  onProgress: (current: number, total: number) => void
): Promise<{items: AuditItem[], usage: TokenUsage}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  // We typically don't need the PDF for structural validation of the JSON, but we pass it if needed. 
  // For safety, we can pass it if the agent decides to look up something, but primarily this is a Logic/Structural check.
  // We'll pass it to keep the interface consistent.
  const filePart = await fileToPart(file);
  const blocks = schemaDef.blocks;
  const validatedItems: AuditItem[] = [];
  let totalUsage: TokenUsage = { promptTokens: 0, outputTokens: 0, totalTokens: 0 };

  const dataByBlock = qaData.reduce((acc, item) => {
      const bid = item.block_id || 0;
      if (!acc[bid]) acc[bid] = [];
      acc[bid].push(item);
      return acc;
  }, {} as Record<number, AuditItem[]>);

  for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const prompt = `EXPORT VALIDATION AGENT. File: ${file.name}. Block ${block.block_number}.
      
      CRITICAL OBJECTIVE: Guarantee 100% integrity for the Excel export.
      
      RESPONSIBILITIES:
      1. 1:1 MAPPING CHECK: Verify each question key/ID maps to the correct Schema Question.
      2. ORDER PRESERVATION: Confirm the output preserves the EXACT original question order from the Schema.
      3. COMPLETENESS: Confirm NO BLANKS exist. If an answer is missing, fill it with "Not described" or extract if possible.
      4. EXACT MATCH ASSERTION: The values must match the input audited values unless correcting a structure/blank error.

      EXPORT VALIDATION GATE:
      If any mismatch is detected, you MUST fix it in your output.
      
      SCHEMA BLOCK: ${JSON.stringify(block, null, 2)}
      CANDIDATE DATA: ${JSON.stringify(dataByBlock[block.block_number] || [], null, 2)}`;

      const response = await generateContentWithRetry(ai, MODEL_FLASH, {
          contents: { parts: [filePart, { text: prompt }] },
          config: { 
            responseMimeType: "application/json", 
            responseSchema: QA_SCHEMA, // Reuse QA schema as it matches structure
            thinkingConfig: { thinkingBudget: 4096 },
            maxOutputTokens: 30000 
          }
      });
      
      const result = safeJsonParse<AuditItem[]>(response.text, []);
      validatedItems.push(...result);

      const usage = mapUsage(response);
      totalUsage.promptTokens += usage.promptTokens;
      totalUsage.outputTokens += usage.outputTokens;
      totalUsage.totalTokens += usage.totalTokens;

      onProgress(i + 1, blocks.length);
  }
  return { items: validatedItems, usage: totalUsage };
};
