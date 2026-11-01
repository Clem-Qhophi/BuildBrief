import type { ResetExample } from '../../lib/reset-example';

export default function RecoveryPlayground({ example }: { example: ResetExample }) {
  const result = example.latestProbe;
  const expected = result ? result.ageMinutes < 30 && !result.alreadyUsed : false;
  const matches = result?.allowed === expected;
  return <section id="try-example" className="recovery-lab" aria-label="Try the password recovery example">
    <div className="lab-controls">
      <p className="section-kicker">Try the actual behavior</p><h2>Would this old link still work?</h2>
      <p>You asked for reset links to expire after 30 minutes. Choose a build and move the example clock. The button runs that build’s real validation code.</p>
      <form method="POST" action="/api/example/probe">
        <input type="hidden" name="project" value={example.project} />
        <fieldset><legend>Which build?</legend><div className="build-choice">
          <label><input type="radio" name="version" value="before" defaultChecked={result?.version !== 'after'} />Original build</label>
          <label><input type="radio" name="version" value="after" defaultChecked={result?.version === 'after'} />Corrected build</label>
        </div></fieldset>
        <label htmlFor="link-age">When was the link sent?</label>
        <select id="link-age" name="age" defaultValue={String(result?.ageMinutes ?? 31)}>
          <option value="5">5 minutes ago · still fresh</option><option value="30">30 minutes ago · expiry boundary</option><option value="31">31 minutes ago · should have expired</option>
        </select>
        <label className="checkbox-row"><input type="checkbox" name="used" value="yes" defaultChecked={result?.alreadyUsed ?? false} />The link has already been used</label>
        <button type="submit">Open the recovery link</button>
      </form>
      <p className="evidence">Simulated account and clock. Real fixture code. No email is sent and no actual password is collected.</p>
    </div>
    <div className="example-browser">
      <div className="example-browser-bar"><span className="browser-dots" aria-hidden="true"><i /><i /><i /></span><span>Lighthouse / account recovery</span><span className="example-label">Example app</span></div>
      <div className="recovery-screen">
        <div className="sample-brand"><span aria-hidden="true">L</span>Lighthouse</div>
        <p className="sample-subtitle">Get back to your workspace.</p>
        <div className={`recovery-result ${result?.allowed ? 'accepted' : 'blocked'}`} role="status" aria-live="polite">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d={result?.allowed ? 'M9 10V6a4 4 0 0 1 8 0' : 'M8 10V6a4 4 0 0 1 8 0v4'} /><circle cx="12" cy="15" r="1" /></svg>
          <h3>{result?.allowed ? 'Recovery form opened' : 'This link can’t be used'}</h3>
          <p>{result?.message ?? 'Choose a build and open the example link.'}</p>
        </div>
        {result && <div className={`behavior-result ${matches ? 'behavior-matches' : 'behavior-mismatch'}`}>
          <strong>{matches ? 'This test matches your requirement.' : 'This test breaks your requirement.'}</strong>
          <p>{result.alreadyUsed ? 'A used link should not open recovery again.' : result.ageMinutes >= 30 ? `The link is ${result.ageMinutes} minutes old. It should be blocked.` : 'A fresh, unused link should open recovery.'}</p>
          <p className="evidence">Executed against the {result.version === 'before' ? 'original' : 'corrected'} build. This checks the example’s link policy, not a complete authentication system.</p>
        </div>}
      </div>
    </div>
  </section>;
}
