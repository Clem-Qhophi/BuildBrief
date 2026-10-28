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
  const params = await searchParams;
  const repoDefault = params['repo'] ?? '';
  const root = workspaceRoot();
  return (
    <main>
      <h1>New intent</h1>
      <p className="muted">
        Capture what you want built. Extraction proposes draft criteria —
        nothing becomes authoritative until an owner approves it.
      </p>
      <div className="notice">
        Ledger lives at <code>{root}/.buildbrief</code>. The repository you
        verify stays on this machine; nothing is uploaded. Verification runs
        locally with the deterministic rules engine unless you pick another
        provider.
      </div>
      <form method="POST" action="/api/capture">
        <p>
          <label>
            Project{' '}
            <input type="text" name="project" defaultValue="demo" required />
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
            <input type="text" name="feature" defaultValue="referral" required />
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
      <p className="muted">
        Next: review the draft, approve it with your name, then verify it
        against the repository revision.
      </p>
    </main>
  );
}
