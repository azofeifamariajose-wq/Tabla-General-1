
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
    .split(';')
    .map(part => normalizeText(part))
    .filter(Boolean);
};

const isNAValue = (value?: string) => normalizeForCompare(value) === 'n/a';

const isEmptyAnswer = (value?: string) => {
  const normalized = normalizeForCompare(value);
  return !normalized || normalized === 'null' || normalized === 'undefined';
};

const hasTraceEvidence = (item?: AuditItem): boolean => {
  if (!item) return false;
  const page = normalizeForCompare(item.page_number);
  const reasoning = normalizeText(item.reasoning);
  const validPage = Boolean(page) && page !== 'n/a' && page !== 'not described';
  return validPage && reasoning.length > 8;
};

const isValidSingleOption = (answer: string, options: string[]) => options.includes(answer);

const validateMultiSelectExact = (answer: string, options: string[]): boolean => {
  const parts = parseMultiSelectValues(answer);
  if (parts.length === 0) return false;
  if (parts.some(part => !options.includes(part))) return false;

  const naSelected = parts.includes('N/A');
  if (naSelected && parts.length > 1) return false;

  return new Set(parts).size === parts.length;
};

const findComparativeGroupCount = (items: AuditItem[]): number | null => {
  const countItem = items.find(item => {
    const question = normalizeForCompare(item.question);
    return question.includes('number of compartive groups described') || question.includes('number of comparative groups described');
  });

  if (!countItem) return null;
  const match = (countItem.answer || '').match(/\d+/);
  if (!match) return null;
  return Number(match[0]);
};

const isDependentOnGroup = (questionLabel: string, groupNumber: number) => {
  return new RegExp(`\\bgroup\\s*${groupNumber}\\b`, 'i').test(questionLabel);
};

const buildDefaultItem = (blockNumber: number, sectionName: string, questionLabel: string): AuditItem => ({
  block_id: blockNumber,
  section_name: sectionName,
  question: questionLabel,
  answer: 'N/A',
  page_number: 'N/A',
  reasoning: 'N/A',
  status: 'CORRECTED',
  auditor_notes: 'Deterministic validator defaulted to N/A.',
});

export interface ValidationIssue {
  questionKey: string;
  currentAnswer: string;
  reason: string;
  recheckStep: 'extraction' | 'audit' | 'qa' | 'export';
}

export interface ValidationResult {
  normalizedItems: AuditItem[];
  failedBlocks: number[];
  correctionCount: number;
  issues: ValidationIssue[];
  isValid: boolean;
}

export const validateAuditDataDeterministically = (
  schemaDef: SchemaDef,
  rawItems: AuditItem[],
  recheckStep: ValidationIssue['recheckStep']
): ValidationResult => {
  const failedBlockSet = new Set<number>();
  const issues: ValidationIssue[] = [];
  let correctionCount = 0;

  const duplicateCounter = new Map<string, number>();
  for (const item of rawItems) {
    const key = buildItemKey(item.block_id || 0, item.question || '');
    duplicateCounter.set(key, (duplicateCounter.get(key) || 0) + 1);
  }

  const itemMap = new Map<string, AuditItem>();
  for (const item of rawItems) {
    itemMap.set(buildItemKey(item.block_id || 0, item.question || ''), item);
  }

  const comparativeGroupCount = findComparativeGroupCount(rawItems);
  const expectedOrder = new Map<string, number>();
  let orderIndex = 0;
  for (const block of schemaDef.blocks) {
    for (const section of block.sections) {
      for (const question of section.questions) {
        expectedOrder.set(buildItemKey(block.block_number, question.label), orderIndex++);
      }
    }
  }

  let lastSeenOrder = -1;
  for (const raw of rawItems) {
    const key = buildItemKey(raw.block_id || 0, raw.question || '');
    const expected = expectedOrder.get(key);
    if (expected === undefined) continue;
    if (expected < lastSeenOrder) {
      issues.push({
        questionKey: `${raw.block_id || 0}::${raw.question}`,
        currentAnswer: normalizeText(raw.answer),
        reason: 'Items are misordered relative to schema.',
        recheckStep
      });
      failedBlockSet.add(raw.block_id || 0);
      break;
    }
    lastSeenOrder = expected;
  }

  const normalizedItems: AuditItem[] = [];

  for (const block of schemaDef.blocks) {
    for (const section of block.sections) {
      for (const question of section.questions) {
        const questionKey = `${block.block_number}::${question.key}`;
        const lookupByLabel = itemMap.get(buildItemKey(block.block_number, question.label));
        const lookupByKey = itemMap.get(buildItemKey(block.block_number, question.key));
        const source = lookupByLabel || lookupByKey;

        const normalizedItem: AuditItem = source
          ? { ...source, block_id: block.block_number, section_name: section.section_name, question: question.label }
          : buildDefaultItem(block.block_number, section.section_name, question.label);

        const duplicateKey = buildItemKey(block.block_number, source?.question || question.label);
        if ((duplicateCounter.get(duplicateKey) || 0) > 1) {
          issues.push({
            questionKey,
            currentAnswer: normalizeText(source?.answer),
            reason: 'Duplicate answers found for the same question.',
            recheckStep
          });
          failedBlockSet.add(block.block_number);
        }

        if (!source || isEmptyAnswer(source.answer)) {
          normalizedItem.answer = 'N/A';
          normalizedItem.page_number = 'N/A';
          normalizedItem.reasoning = 'N/A';
          normalizedItem.status = 'CORRECTED';
          normalizedItem.auditor_notes = 'Missing answer. Forced to N/A pending re-check.';
          issues.push({
            questionKey,
            currentAnswer: normalizeText(source?.answer),
            reason: 'Required question is empty/undefined/null.',
            recheckStep
          });
          correctionCount++;
          failedBlockSet.add(block.block_number);
        }

        if (question.options && question.options.length > 0 && !isNAValue(normalizedItem.answer)) {
          const validOption = isMultiSelectType(question.type)
            ? validateMultiSelectExact(normalizedItem.answer, question.options)
            : isValidSingleOption(normalizedItem.answer, question.options);

          if (!validOption) {
            issues.push({
              questionKey,
              currentAnswer: normalizedItem.answer,
              reason: 'Answer does not exactly match allowed options.',
              recheckStep
            });
            normalizedItem.answer = 'N/A';
            normalizedItem.page_number = 'N/A';
            normalizedItem.reasoning = 'N/A';
            normalizedItem.status = 'CORRECTED';
            normalizedItem.auditor_notes = 'Invalid option value. Forced to N/A pending re-check.';
            correctionCount++;
            failedBlockSet.add(block.block_number);
          }
        }

        if (!isNAValue(normalizedItem.answer) && !hasTraceEvidence(normalizedItem)) {
          issues.push({
            questionKey,
            currentAnswer: normalizedItem.answer,
            reason: 'Non-N/A answer lacks required trace evidence.',
            recheckStep
          });
          normalizedItem.answer = 'N/A';
          normalizedItem.page_number = 'N/A';
          normalizedItem.reasoning = 'N/A';
          normalizedItem.status = 'CORRECTED';
          normalizedItem.auditor_notes = 'Missing trace evidence. Forced to N/A.';
          correctionCount++;
          failedBlockSet.add(block.block_number);
        }

        if (comparativeGroupCount !== null && comparativeGroupCount >= 0) {
          for (let group = comparativeGroupCount + 1; group <= 8; group++) {
            if (isDependentOnGroup(question.label, group) && !isNAValue(normalizedItem.answer)) {
              normalizedItem.answer = 'N/A';
              normalizedItem.page_number = 'N/A';
              normalizedItem.reasoning = 'N/A';
              normalizedItem.status = 'CORRECTED';
              normalizedItem.auditor_notes = `Group ${group} not present in source. Forced to N/A.`;
              
              // On export we can safely auto-correct group-dependent overflow fields.
              // Keep hard failures for earlier stages to trigger targeted re-checks.
              if (recheckStep !== 'export') {
                issues.push({
                  questionKey,
                  currentAnswer: source?.answer || '',
                  reason: `Question depends on Group ${group}, but source declares fewer groups.`,
                  recheckStep
                });
                correctionCount++;
                failedBlockSet.add(block.block_number);
              }
              break;
            }
          }
        }

        normalizedItems.push(normalizedItem);
      }
    }
  }

  return {
    normalizedItems,
    failedBlocks: Array.from(failedBlockSet),
    correctionCount,
    issues,
    isValid: issues.length === 0
  };
};
