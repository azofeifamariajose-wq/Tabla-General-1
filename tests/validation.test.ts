
import * as assert from 'node:assert/strict';
import { validateAuditDataDeterministically } from '../services/deterministicValidation';
import { AuditItem, SchemaDef } from '../types';

const schema: SchemaDef = {
  blocks: [
    {
      block_number: 1,
      block_name: 'Block 1',
      sections: [
        {
          "section_name": "Section A",
          "questions": [
            { key: 'group_count', label: 'Number of comparative groups described', type: 'single_select', options: ['1', '2', '3', 'N/A'] },
            { key: 'group_2_name', label: 'Group 2 name', type: 'text' },
            { key: 'dose', label: 'Dose option', type: 'single_select', options: ['Low', 'High', 'N/A'] },
            { key: 'traceable', label: 'Traceable field', type: 'text' }
          ]
        }
      ]
    }
  ]
};

const makeItem = (question: string, answer: string, page = '12', reasoning = 'Section A excerpt evidence'): AuditItem => ({
  block_id: 1,
  section_name: 'Section A',
  question,
  answer,
  page_number: page,
  reasoning,
  status: 'VERIFIED',
  auditor_notes: ''
});

const testMissingGroupToNA = () => {
  const items: AuditItem[] = [
    makeItem('Number of comparative groups described', '1'),
    makeItem('Group 2 name', 'Treatment Arm B')
  ];
  const res = validateAuditDataDeterministically(schema, items, 'audit');
  const group2 = res.normalizedItems.find(i => i.question === 'Group 2 name');
  assert.equal(group2?.answer, 'N/A');
};

const testInvalidOptionFails = () => {
  const items: AuditItem[] = [
    makeItem('Number of comparative groups described', '1'),
    makeItem('Dose option', 'medium')
  ];
  const res = validateAuditDataDeterministically(schema, items, 'audit');
  assert.ok(res.issues.some(i => i.reason.includes('allowed options')));
};

const testDuplicateFails = () => {
  const items: AuditItem[] = [
    makeItem('Number of comparative groups described', '1'),
    makeItem('Dose option', 'Low'),
    makeItem('Dose option', 'High')
  ];
  const res = validateAuditDataDeterministically(schema, items, 'qa');
  assert.ok(res.issues.some(i => i.reason.includes('Duplicate answers')));
};

const testMisorderedFails = () => {
  const items: AuditItem[] = [
    makeItem('Dose option', 'Low'),
    makeItem('Number of comparative groups described', '1')
  ];
  const res = validateAuditDataDeterministically(schema, items, 'export');
  assert.ok(res.issues.some(i => i.reason.includes('misordered')));
};

const testMissingTraceBecomesNA = () => {
  const items: AuditItem[] = [
    makeItem('Number of comparative groups described', '1'),
    makeItem('Traceable field', 'Some value', 'N/A', '')
  ];
  const res = validateAuditDataDeterministically(schema, items, 'audit');
  const traceable = res.normalizedItems.find(i => i.question === 'Traceable field');
  assert.equal(traceable?.answer, 'N/A');
};

const run = () => {
  testMissingGroupToNA();
  testInvalidOptionFails();
  testDuplicateFails();
  testMisorderedFails();
  testMissingTraceBecomesNA();
  console.log('All deterministic validation tests passed.');
};

run();
