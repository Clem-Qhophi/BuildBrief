import AppShell from '../../components/AppShell';
import { projectParams } from '../../../lib/context';
import type { CorrectionPack } from '@buildbrief/domain';
import { getViews, workspaceRoot } from '../../../lib/ledger';
import { buildHandoff } from '../../../lib/idea';

export const dynamic = 'force-dynamic';

export default function IntentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return IntentAsync({ params, searchParams });
}

async function IntentAsync({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await projectParams(await searchParams);
  const root = workspaceRoot();
  const project = query['project'] ?? '';
  const repoDefault = query['repo'] ?? '';
  const views = getViews(root, project);
  const intent = views.intents[id];
  if (intent === undefined) {
    return (
      <AppShell active="new" context={query}>
        <h1>Intent not found</h1>
        <p className="muted">
          No intent <code>{id}</code> in project <code>{project}</code>.
        </p>
        <p><a href={`/workspace?project=${encodeURIComponent(project)}`}>Open the project overview</a> to pick an existing intent, or <a href={`/new?project=${encodeURIComponent(project)}`}>describe a new feature</a>.</p>
      </AppShell>
    );
  }
  const findings = Object.values(views.findings).filter((f) => f.requirement_version_id === id);
  const findingIds = new Set(findings.map((f) => f.id));
  const packs = Object.values(views.packs).filter((p: CorrectionPack) =>
    p.finding_ids.some((fid) => findingIds.has(fid)),
  );
  return (
    <AppShell active="new" context={query}>
      {query['error'] && <div className="notice error" role="alert"><strong>Verification didn’t complete.</strong><p>{query['error']}</p><p>Check the repository path, commit, and selected provider, then submit again.</p></div>}
      {query['connected'] === '1' && <div className="notice ok" role="status">Repository connected{repoDefault !== '' ? <>: <code>{repoDefault}</code></> : ''}. The brief below can now be checked against this code.</div>}
      <h1>
        {intent.feature_id} <span className="muted">v{intent.version}</span>{' '}
        <span className={`badge ${intent.state === 'approved' ? 'supported' : ''}`}>{intent.state}</span>
      </h1>
      <p className="muted">
        <a href={`/map?project=${encodeURIComponent(project)}&intent=${encodeURIComponent(intent.id)}`}>Comprehension map</a>
        {repoDefault !== '' ? (
          <> — <a href={`/connect?repo=${encodeURIComponent(repoDefault)}`}>connection status</a></>
        ) : null}
      </p>
      <ol className="steps">
        {repoDefault ? <><li className="done">1 · Connect repository</li><li className="done">2 · Describe what to build</li><li className={intent.state === 'approved' ? 'done' : 'now'}>3 · Approve requirements</li><li>4 · Verify implementation</li><li>5 · Fix and recheck</li></> : <><li className="done">1 · Describe your idea</li><li className={intent.state === 'approved' ? 'done' : 'now'}>2 · Review and approve</li><li className={intent.state === 'approved' ? 'now' : undefined}>3 · Give your agent the brief</li><li>4 · Connect code when ready</li><li>5 · Check the implementation</li></>}
      </ol>
      <p className="muted">{intent.approved_by !== undefined ? `approved by ${intent.approved_by}` : 'Draft — not approved'}</p>
      <details className="technical-details"><summary>Capture details</summary><p><code>{intent.id}</code> — captured {intent.captured_at} ({intent.capture_completeness})</p><p className="evidence">sha256 {intent.source_hash}</p></details>

      <h2>Your original request</h2>
      <div className="notice ok">
        {intent.state === 'approved'
          ? `Approved contract — verification checks this exact version (v${intent.version}). New edits need a new approval.`
          : 'Draft — nothing here is authoritative yet. Review the criteria below, then approve with your name.'}
      </div>
      <pre>{intent.exact_source_text}</pre>

      <h2>Requirements ({intent.criteria.length})</h2>
      <p className="muted">
        Each row proposes one thing the product should do. Check that the wording
        matches your intent before approving. Search details are optional technical context.
      </p>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Search details</th>
          </tr>
        </thead>
        <tbody>
          {intent.criteria.map((c) => (
            <tr key={c.id}>
              <td>{c.text}{c.negative === true ? ' (must NOT)' : ''}</td>
              <td className="evidence"><details><summary>How evidence search starts</summary><p><code>{c.id}</code> · {c.keywords.join(', ')}</p><p>Search terms are not proof by themselves.</p></details></td>
            </tr>
          ))}
        </tbody>
      </table>

      {intent.constraints.length > 0 && (
        <>
          <h2>Boundaries ({intent.constraints.length})</h2>
          <ul>
            {intent.constraints.map((c, i) => (
              <li key={i}>{c.rule} <span className="evidence">[{c.severity ?? 'medium'}]</span></li>
            ))}
          </ul>
        </>
      )}

      {intent.ambiguity_flags.length > 0 && (
        <>
          <h2>Questions to resolve</h2>
          <ul>
            {intent.ambiguity_flags.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </>
      )}

      {intent.state !== 'approved' ? (
        <>
          <h2>Approve</h2>
          <form method="POST" action="/api/approve">
            <input type="hidden" name="project" value={project} />
            <input type="hidden" name="intent" value={intent.id} />
            {repoDefault !== '' ? <input type="hidden" name="repo" value={repoDefault} /> : null}
            <input type="text" name="actor" aria-label="Owner name" placeholder="Your name (owner)" required />{' '}
            <button type="submit">Approve this version</button>
          </form>
          <p className="muted">Approval records the name you enter in this local ledger. It does not authenticate identity. Drafts never verify.</p>
          <p><a href={`/new?project=${encodeURIComponent(project)}&repo=${encodeURIComponent(repoDefault)}`}>Capture a corrected draft</a> if these criteria do not match your request.</p>
        </>
      ) : (
        <>
          {repoDefault === '' && <section className="card build-handoff"><h2>Your brief is ready for the first build.</h2><p>You can begin in Muse Code, Codex, or your existing coding workflow. Give the agent this approved brief. Once it creates a repository, connect that code to this same project and check it here.</p><p><a className="button" href={`/api/brief?project=${encodeURIComponent(project)}&intent=${encodeURIComponent(intent.id)}`}>Download approved build brief</a>{' '}<a href={`/connect?project=${encodeURIComponent(project)}&method=local&intent=${encodeURIComponent(intent.id)}`}>Connect the code when it exists</a></p><details><summary>Read or copy the build handoff</summary><pre>{buildHandoff(intent)}</pre></details><p className="evidence">BuildBrief has recorded the plan; it has not built or tested this new product yet.</p></section>}
          <details className="technical-details" open={repoDefault !== ''}><summary>{repoDefault ? 'Check the implementation' : 'Connect code & check later'}</summary>
          <h2>Verify now</h2>
          <form method="POST" action="/api/verify">
            <input type="hidden" name="project" value={project} />
            <input type="hidden" name="intent" value={intent.id} />
            <p>
              <label>
                Repository directory{' '}
                <input type="text" name="repo" defaultValue={repoDefault} placeholder="C:\path\to\repo" size={48} required />
              </label>
            </p>
            <p>
              <label>
                Base revision (optional){' '}
                <input type="text" name="base" placeholder="base SHA for change detection" size={44} />
              </label>{' '}
              <label>
                Provider{' '}
                <select name="provider" defaultValue="rules">
                  <option value="rules">rules (deterministic, offline)</option>
                  <option value="mock">mock</option>
                  <option value="meta">meta (needs BB_META_API_KEY)</option>
                </select>
              </label>
            </p>
            <p>
              <label>
                Acceptance command (optional, runs in the repo){' '}
                <input type="text" name="accept" placeholder="npm test" size={30} />
              </label>{' '}
              <label>
                Covers (comma paths this command exercises){' '}
                <input type="text" name="covers" placeholder="src/referral.js" size={30} />
              </label>{' '}
              <button type="submit">Verify at current revision</button>
            </p>
            <p className="muted">Without a command, grades rest on source evidence alone (E1 at best).</p>
          </form>
          </details>
          {(repoDefault !== '' || findings.length > 0) && <>
          <h2>Findings ({findings.length})</h2>
          {findings.length === 0 ? (
            <p className="muted">Approved but not yet verified — run <code>bb verify</code> or re-check from a run.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Finding</th>
                  <th>Grade</th>
                  <th>Revision</th>
                  <th>Run</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id}>
                    <td>{intent.criteria.find((c) => c.id === f.criterion_id)?.text ?? f.criterion_id} <div className="evidence">{f.criterion_id}</div></td>
                    <td>
                      <span className={`badge ${f.finding}`}>{f.finding}</span>
                      {f.stale ? ' (stale)' : ''}
                    </td>
                    <td>{f.evidence_grade}</td>
                    <td><code>{f.checked_revision.slice(0, 7)}</code></td>
                    <td>
                      <a href={`/run/${encodeURIComponent(f.run_id)}?project=${encodeURIComponent(project)}`}>
                        <code>{f.run_id.slice(0, 18)}…</code>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h2>Correction packs ({packs.length})</h2>
          {packs.length === 0 ? (
            <p className="muted">No packs yet — generate one from a run with failures. A pack is guidance, never a resolution.</p>
          ) : (
            packs.map((p) => (
              <section key={p.id} className="section">
                <h3><code>{p.id}</code></h3>
                <pre>{p.instructions}</pre>
                <p className="evidence">scope: {p.proposed_change_scope.join(', ')} | do_not_touch: {p.do_not_touch.join(', ')}</p>
                <p className="evidence">acceptance: {p.acceptance_commands.join(' && ')} | unknowns: {p.unknowns.join('; ')}</p>
              </section>
            ))
          )}
          </>}
        </>
      )}
    </AppShell>
  );
}
