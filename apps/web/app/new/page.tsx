import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { workspaceRoot } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default function NewIntentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return NewAsync({ searchParams });
}

async function NewAsync({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await projectParams(await searchParams);
  const repoDefault = params['repo'] ?? '';
  const root = workspaceRoot();
  return (
    <AppShell active="new" context={params}>
      <h1>New intent</h1>
      <p className="lede">
        Describe one thing your product should do, in your own words. We’ll
        turn it into a draft review brief. You review and approve the requirements next.
      </p>
      <ol className="steps">
        <li className={repoDefault !== '' ? 'done' : undefined}>1 · Connect repository</li>
        <li className="now">2 · Describe what to build</li>
        <li>3 · Approve requirements</li>
        <li>4 · Verify implementation</li>
        <li>5 · Fix and recheck</li>
      </ol>
      {params['connected'] === '1' && <div className="notice ok" role="status">Repository connected. Now describe what your agent should build.</div>}
      <div className="notice">Start with a concrete behavior: “Password reset links should expire after 30 minutes.” Your original words are preserved. The draft is a proposal until you approve it.</div>
      {repoDefault === '' && <p className="muted">Starting a whole new product? <a href="/start">Start with your idea</a>. You can also capture a feature draft here before connecting code.</p>}
      <form method="POST" action="/api/capture">
        <p>
          <label>
            Project{' '}
            <input type="text" name="project" defaultValue={params['project'] || ''} placeholder="My product" required />
          </label>
        </p>
        <p>
          <label>
            Repository directory (local path, used at verify time){' '}
            <input type="text" name="repo" defaultValue={repoDefault} placeholder="C:\path\to\repo" size={48} />
          </label>
        </p>
        <p>
          <label>
            Feature{' '}
            <input type="text" name="feature" placeholder="Referral code expiry" required />
          </label>
        </p>
        <p>
          <label>
            What should be built?<br />
            <textarea
              name="prompt"
              rows={5}
              cols={72}
              required
              placeholder="Add referral codes with 20 percent credit on first invoice. Codes expire after 30 days. Do not modify authentication."
            />
          </label>
        </p>
        <p>
          <button type="submit">Capture draft intent</button>
        </p>
      </form>
      <details className="technical-details"><summary>Where this brief is stored</summary><p>Ledger directory: <code>{root}/.buildbrief</code></p></details>
      <p className="muted">This creates your draft brief. Next you’ll review it, approve it with your name, and check the implementation.</p>
    </AppShell>
  );
}
