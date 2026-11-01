import AppShell from '../components/AppShell';
import { projectParams } from '../../lib/context';
import { agentSetups, detectAgents, mcpServerPath } from '../../lib/agent-setup';

export const dynamic = 'force-dynamic';

export default function ConnectionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return ConnectionsAsync({ searchParams });
}

async function ConnectionsAsync({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const params = await projectParams(query);
  const setups = agentSetups(mcpServerPath(), detectAgents());
  const result = query['test'] ?? '';
  const detail = query['detail'] ?? '';
  return (
    <AppShell active="connections" context={params}>
      <h1>Agent connections</h1>
      <p className="lede">Connect your installed coding agents to BuildBrief over local MCP. Detection below ran on this machine just now.</p>
      {result === 'pass' && <div className="notice ok" role="status">Connection test passed: {detail}</div>}
      {result === 'error' && <div className="notice error" role="alert">Connection test failed: {detail}</div>}
      <div className="grid cols-2">
        {setups.map((setup) => (
          <section key={setup.id} className="card">
            <h2>{setup.name}</h2>
            <p className="muted">{setup.version ?? 'Not detected on PATH'}</p>
            <p>{setup.mcpMethod}</p>
            {setup.mcpCommand !== null && <pre>{setup.mcpCommand}</pre>}
            <p className="muted">Hooks: {setup.hooksNote}</p>
            <ul>
              {setup.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <h2>Test the server</h2>
      <p className="muted">Runs the real MCP server against a disposable workspace: initialize, tool discovery, a capture, and ledger confirmation. Your workspace is never touched. In-agent runs still need one owner test per agent.</p>
      <form method="POST" action="/api/connections/test">
        <button type="submit">Run connection test</button>
      </form>
      <h2>Take the setup with you</h2>
      <p><a href="/api/connections/guide">Download the MCP setup guide</a> (generated now; contains install paths only, never secrets or ledger data).</p>
    </AppShell>
  );
}
