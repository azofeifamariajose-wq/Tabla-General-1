
import { AuditItem, QuestionDef, SchemaDef } from '../types';

const normalizeText = (value?: string) => (value || '').trim();

const normalizeForCompare = (value?: string) => normalizeText(value).toLowerCase();

const buildItemKey = (blockId: number, question: string) => `${blockId}::${normalizeForCompare(question)}`;

const isMultiSelectType = (type?: string) => {
  const normalized = normalizeForCompare(type);
  return normalized === 'multi_select' || normalized === 'multiple_select';
};

const parseMultiSelectValues = (value: string): string[] => {
  return value
    .split(/\n|,|;|\||\/|\band\b/gi)
    .map(part => normalizeText(part))
    .filter(Boolean);
};

const normalizeOptionValue = (value: string, options: string[]): string => {
  const exactMatch = options.find(opt => normalizeForCompare(opt) === normalizeForCompare(value));
  if (exactMatch) return exactMatch;

  const containsMatch = options.find(opt => {
    const normalizedOption = normalizeForCompare(opt);
    const normalizedValue = normalizeForCompare(value);
    return normalizedValue.includes(normalizedOption) || normalizedOption.includes(normalizedValue);
  });

  if (containsMatch) return containsMatch;

  const na = options.find(opt => normalizeForCompare(opt) === 'n/a');
  if (na) return na;

  const notDescribed = options.find(opt => normalizeForCompare(opt) === 'not described');
  return notDescribed || 'N/A';
};

const normalizeMultiSelectValue = (value: string, options: string[]): string => {
  const parts = parseMultiSelectValues(value);
  const selected: string[] = [];

  for (const option of options) {
    const normalizedOption = normalizeForCompare(option);
    const wasMentioned = parts.some(part => {
      const normalizedPart = normalizeForCompare(part);
      return normalizedPart === normalizedOption || normalizedPart.includes(normalizedOption) || normalizedOption.includes(normalizedPart);
    });
    if (wasMentioned) selected.push(option);
  }

  // --- NEW LOGIC: Enforce exclusive N/A for multi-select ---
  // If 'N/A' is selected, it must be the ONLY selection.
  const naOption = options.find(opt => normalizeForCompare(opt) === 'n/a');
  if (naOption && selected.includes(naOption)) {
      return naOption;
  }
  // --- END NEW LOGIC ---

  if (selected.length === 0) {
    const na = options.find(opt => normalizeForCompare(opt) === 'n/a');
    if (na) return na;
    const notDescribed = options.find(opt => normalizeForCompare(opt) === 'not described');
    if (notDescribed) return notDescribed;
    return 'N/A';
  }

  return selected.join('; ');
};

const getDefaultAnswer = (question: QuestionDef): string => {
  const schemaDefault = normalizeText(question.default);
  if (schemaDefault) return schemaDefault;

  if (question.options && question.options.length > 0) {
    return normalizeOptionValue('N/A', question.options);
  }

  return 'N/A';
};

export interface ValidationResult {
  normalizedItems: AuditItem[];
  failedBlocks: number[];
  correctionCount: number;
}

export const validateAuditDataDeterministically = (
  schemaDef: SchemaDef,
  rawItems: AuditItem[]
): ValidationResult => {
  const failedBlockSet = new Set<number>();
  let correctionCount = 0;

  const itemMap = new Map<string, AuditItem>();
  for (const item of rawItems) {
    itemMap.set(buildItemKey(item.block_id || 0, item.question), item);
  }

  const normalizedItems: AuditItem[] = [];

  for (const block of schemaDef.blocks) {
    for (const section of block.sections) {
      for (const question of section.questions) {
        const byLabel = itemMap.get(buildItemKey(block.block_number, question.label));
        const byKey = itemMap.get(buildItemKey(block.block_number, question.key));
        const source = byLabel || byKey;

        const answerBefore = normalizeText(source?.answer);
        let answer = answerBefore;

        if (!answer) {
          answer = getDefaultAnswer(question);
          correctionCount++;
          failedBlockSet.add(block.block_number);
        }

        if (question.options && question.options.length > 0) {
          const normalized = isMultiSelectType(question.type)
            ? normalizeMultiSelectValue(answer, question.options)
            : normalizeOptionValue(answer, question.options);
          if (normalized !== answer) {
            answer = normalized;
            correctionCount++;
            failedBlockSet.add(block.block_number);
          }
        }

        const wasQuestionRemapped = source ? normalizeForCompare(source.question) !== normalizeForCompare(question.label) : true;
        if (wasQuestionRemapped) {
          failedBlockSet.add(block.block_number);
          correctionCount++;
        }

        const existingReasoning = normalizeText(source?.reasoning);
        const reasons: string[] = [];
        if (!answerBefore) reasons.push('Filled blank answer');
        if (question.options && question.options.length > 0 && answer !== answerBefore) reasons.push('Normalized option value');
        if (wasQuestionRemapped) reasons.push('Re-aligned question order');

        normalizedItems.push({
          block_id: block.block_number,
          section_name: section.section_name,
          question: question.label,
          answer,
          page_number: normalizeText(source?.page_number) || 'Not described',
          reasoning: [existingReasoning, reasons.length ? `[Validator] ${reasons.join('; ')}` : ''].filter(Boolean).join(' | '),
          status: source?.status || (reasons.length ? 'CORRECTED' : 'VERIFIED'),
          original_answer: source?.original_answer,
          auditor_notes: normalizeText(source?.auditor_notes) || (reasons.length ? 'Deterministic validator adjusted value/structure.' : 'Validated by deterministic rules.'),
          qa_status: source?.qa_status,
          qa_notes: source?.qa_notes,
        });
      }
    }
  }

  return {
    normalizedItems,
    failedBlocks: Array.from(failedBlockSet),
    correctionCount
  };
};
