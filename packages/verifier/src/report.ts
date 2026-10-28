import { type VerificationReport } from './verify.js';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderMarkdown(report: VerificationReport): string {
  const lines: string[] = [];
  lines.push('# Build Brief verification report');
  lines.push('');
  lines.push(`- run: \`${report.run_id}\` - revision: \`${report.checked_revision}\``);
  if (report.base_revision !== null) lines.push(`- base: \`${report.base_revision}\``);
  lines.push(`- intent version: \`${report.requirement_version_id}\` - provider: ${report.provider}/${report.model}`);
  lines.push(`- created: ${report.created_at}`);
  lines.push('');
  lines.push('## Findings');
  for (const r of report.results) {
    const f = r.finding;
    lines.push(`### [${f.finding}] ${r.criterion.text}`);
    lines.push('');
    lines.push(`- criterion: \`${f.criterion_id}\` - grade: ${f.evidence_grade} - confidence: ${f.confidence}`);
    lines.push(`- rationale: ${f.rationale}`);
    for (const e of r.evidence) {
      const loc = e.path !== undefined ? `${e.path}${e.line_start !== undefined ? `#L${e.line_start}-${e.line_end ?? e.line_start}` : ''}` : '(no path)';
      lines.push(`- evidence \`${e.id}\` [${e.tier}] ${loc} — ${e.description}`);
    }
    if (f.missing_proof.length > 0) lines.push(`- missing proof: ${f.missing_proof.join('; ')}`);
    if (r.adjudicatorNotes.length > 0) lines.push(`- adjudicator: ${r.adjudicatorNotes.join(' | ')}`);
    lines.push('');
  }
  lines.push('## Possibly unrequested changes');
  if (report.orphans.length === 0) {
    lines.push('None flagged.');
  } else {
    for (const o of report.orphans) {
      lines.push(`- [${o.risk}] ${o.path} — ${o.why_flagged} (flags: ${o.flags.join(', ')})`);
    }
  }
  lines.push('');
  lines.push('## Test runs');
  if (report.test_runs.length === 0) {
    lines.push('No test runs recorded — grades rest on source evidence alone (E1 at best).');
  } else {
    for (const t of report.test_runs) {
      lines.push(`- \`${t.run.id}\` ${t.run.command.join(' ')} — exit ${t.run.exit_code}, passed ${t.run.passed}, failed ${t.run.failed}, covers: ${t.covers.join(', ') || 'nothing (no grade effect)'}`);
    }
  }
  lines.push('');
  lines.push(`Summary: ${Object.entries(report.summary).map(([k, v]) => `${k}=${v}`).join(', ') || 'no criteria'}`);
  lines.push('');
  return lines.join('\n');
}

export function renderHtml(report: VerificationReport): string {
  const rows = report.results.map((r) => {
    const f = r.finding;
    const ev = r.evidence.map((e) => `<li><code>${esc(e.id)}</code> [${e.tier}] ${esc(e.path ?? '(no path)')}${e.line_start !== undefined ? ` L${e.line_start}-${e.line_end ?? e.line_start}` : ''} — ${esc(e.description)}</li>`).join('');
    return `<section><h3>[${f.finding}] ${esc(r.criterion.text)}</h3><p>grade ${f.evidence_grade} · confidence ${f.confidence}</p><p>${esc(f.rationale)}</p><ul>${ev}</ul></section>`;
  }).join('\n');
  const orphans = report.orphans.length === 0
    ? '<p>None flagged.</p>'
    : `<ul>${report.orphans.map((o) => `<li>[${o.risk}] ${esc(o.path)} — ${esc(o.why_flagged)}</li>`).join('')}</ul>`;
  const tests = report.test_runs.length === 0
    ? '<p>No test runs recorded — grades rest on source evidence alone (E1 at best).</p>'
    : `<ul>${report.test_runs.map((t) => `<li><code>${esc(t.run.id)}</code> ${esc(t.run.command.join(' '))} — exit ${t.run.exit_code}, passed ${t.run.passed}, failed ${t.run.failed}</li>`).join('')}</ul>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Build Brief report ${esc(report.run_id)}</title></head><body><h1>Build Brief verification report</h1><p>run ${esc(report.run_id)} - revision ${esc(report.checked_revision)} - ${esc(report.provider)}/${esc(report.model)}</p>${rows}<h2>Possibly unrequested changes</h2>${orphans}<h2>Test runs</h2>${tests}</body></html>`;
}

export function renderJson(report: VerificationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
