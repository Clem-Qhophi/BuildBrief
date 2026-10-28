import type { CorrectionPack } from '@buildbrief/domain';
import { getViews, workspaceRoot } from '../../../lib/ledger';

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
  const query = await searchParams;
  const root = workspaceRoot();
  const project = query['project'] ?? '';
  const repoDefault = query['repo'] ?? '';
  const views = getViews(root, project);
  const intent = views.intents[id];
  if (intent === undefined) {
    return (
      <main>
        <h1>Intent not found</h1>
        <p className="muted">
          No intent <code>{id}</code> in project <code>{project}</code>.
        </p>
      </main>
    );
  }
  const findings = Object.values(views.findings).filter((f) => f.requirement_version_id === id);
  const findingIds = new Set(findings.map((f) => f.id));
  const packs = Object.values(views.packs).filter((p: CorrectionPack) =>
    p.finding_ids.some((fid) => findingIds.has(fid)),
  );
  return (
    <main>
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
      <p className="muted">
        <code>{intent.id}</code> — captured {intent.captured_at} ({intent.capture_completeness})
        {intent.approved_by !== undefined ? ` — approved by ${intent.approved_by} at ${intent.approved_at}` : ' — not approved'}
      </p>

      <h2>Source text</h2>
      <pre>{intent.exact_source_text}</pre>
      <p className="evidence">sha256 {intent.source_hash}</p>

      <h2>Criteria ({intent.criteria.length})</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Text</th>
            <th>Keywords</th>
          </tr>
        </thead>
        <tbody>
          {intent.criteria.map((c) => (
            <tr key={c.id}>
              <td><code>{c.id}</code></td>
              <td>{c.text}{c.negative === true ? ' (must NOT)' : ''}</td>
              <td className="evidence">{c.keywords.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {intent.constraints.length > 0 && (
        <>
          <h2>Constraints ({intent.constraints.length})</h2>
          <ul>
            {intent.constraints.map((c, i) => (
              <li key={i}>{c.rule} <span className="evidence">[{c.severity ?? 'medium'}]</span></li>
            ))}
          </ul>
        </>
      )}

      {intent.ambiguity_flags.length > 0 && (
        <>
          <h2>Open ambiguities</h2>
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
            <input type="text" name="actor" placeholder="Your name (owner)" required />{' '}
            <button type="submit">Approve this version</button>
          </form>
          <p className="muted">Approval is recorded in the ledger with your name. Drafts never verify.</p>
        </>
      ) : (
        <>
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
                    <td><code>{f.criterion_id}</code></td>
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
        </>
      )}
    </main>
  );
}
