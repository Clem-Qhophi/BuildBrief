import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atlasFromReport, atlasChapter } from '../lib/atlas.ts';

function report() {
  return { run_id: 'saved/run', project_id: 'A & B', requirement_version_id: 'brief/one', checked_revision: 'abc123', provider: 'rules', results: [{ criterion: { id: 'expiry', text: 'Links expire.' }, finding: { finding: 'not_established', evidence_grade: 'E1_source', rationale: 'Runtime evidence is missing.', missing_proof: ['A passing acceptance check.'] }, evidence: [{ id: 'source & one', path: 'reset.ts', line_start: 4, line_end: 8 }, { id: 'test-only', test_run_id: 'recorded-test' }] }], test_runs: [{ run: { id: 'recorded-test', command: ['node', 'acceptance.mjs'], exit_code: 1, passed: 2, failed: 3 }, covers: ['reset.ts'] }] };
}

test('map preserves unresolved findings, citations, and executed failures without inventing support', () => {
  const input = report();
  const map = atlasFromReport(input, 'C:\\repo & work');
  assert.equal(map.criteria[0].status, 'not_established');
  assert.equal(map.criteria[0].label, 'Not enough proof');
  assert.deepEqual(map.criteria[0].missing, input.results[0].finding.missing_proof);
  assert.equal(map.criteria[0].sources.length, 1);
  assert.equal(map.criteria[0].sources[0].lines, 'L4–8');
  const href = new URL(map.criteria[0].sources[0].href, 'http://localhost');
  assert.equal(href.searchParams.get('evidence'), 'source & one');
  assert.equal(href.searchParams.get('repo'), 'C:\\repo & work');
  assert.deepEqual(map.tests[0], { id: 'recorded-test', command: 'node acceptance.mjs', passed: 2, failed: 3, exit: 1, covers: ['reset.ts'] });
  assert.ok(map.reportHref.startsWith('/run/saved%2Frun?'));
  assert.equal(new URL(map.briefHref, 'http://localhost').searchParams.get('project'), 'A & B');
  assert.match(map.understandHref, /view=technical#understand$/);
});

test('map does not manufacture a test, source citation, or certainty for unknown evidence', () => {
  const input = report();
  input.results[0].evidence = [];
  input.results[0].finding.finding = 'future-verdict';
  delete input.test_runs;
  const map = atlasFromReport(input);
  assert.deepEqual(map.tests, []);
  assert.deepEqual(map.criteria[0].sources, []);
  assert.equal(map.criteria[0].status, 'future-verdict');
  assert.equal(map.criteria[0].label, 'Not enough proof');
  assert.equal(new URL(map.reportHref, 'http://localhost').searchParams.has('repo'), false);
});

test('scroll chapter boundaries are stable forward, backward, and outside the normal range', () => {
  const progress = [0, 0.199, 0.2, 0.399, 0.4, 0.599, 0.6, 0.799, 0.8, 1];
  const expected = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  assert.deepEqual(progress.map(atlasChapter), expected);
  assert.deepEqual(progress.toReversed().map(atlasChapter), expected.toReversed());
  for (const value of [-1, NaN, Infinity]) assert.equal(atlasChapter(value), 0);
  assert.equal(atlasChapter(10), 4);
});
