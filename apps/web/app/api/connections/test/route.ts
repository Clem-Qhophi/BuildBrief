import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { redirect } from 'next/navigation';
import { EXPECTED_TOOL_COUNT, mcpServerPath } from '../../../../lib/agent-setup';

function rpc(id: number, method: string, params: Record<string, unknown> = {}): string {
  return JSON.stringify({ jsonrpc: '2.0', id, method, params });
}

/** Executes the MCP server in a child process against a scratch workspace. */
function runServer(server: string, workspace: string, lines: string[]): Promise<{ stdout: string; error: string | null }> {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [server], {
      env: { ...process.env, BB_WORKSPACE: workspace },
      timeout: 30_000,
    }, (error, stdout) => {
      resolve({ stdout: String(stdout ?? ''), error: error === null ? null : error.message });
    });
    child.stdin?.write(`${lines.join('\n')}\n`);
    child.stdin?.end();
  });
}

/**
 * Real server-side connection test on a disposable workspace: initialize,
 * tools/list (expects 12 tools), a write tool call, then confirms the write
 * reached that workspace ledger. Never touches the owner workspace.
 */
export async function POST(): Promise<Response> {
  const target = '/connections';
  // Compute the destination first: Next's redirect() throws, so calling it
  // inside try/catch would turn success into a harness failure.
  let destination: string;
  try {
    const server = mcpServerPath();
    const workspace = mkdtempSync(join(tmpdir(), 'bb-conn-test-'));
    const marker = `probe ${Date.now().toString(36)}`;
    const { stdout, error } = await runServer(server, workspace, [
      rpc(1, 'initialize'),
      rpc(2, 'tools/list'),
      rpc(3, 'tools/call', { name: 'bb_list_intents', arguments: { project: 'probe' } }),
      rpc(4, 'tools/call', { name: 'bb_capture', arguments: { project: 'probe', prompt: marker } }),
    ]);
    if (error !== null) {
      destination = `${target}?test=error&detail=${encodeURIComponent(`MCP server failed: ${error.slice(0, 160)}`)}`;
    } else {
      const replies = stdout.split('\n').filter((l) => l.trim().length > 0).map((l) => {
        try {
          return JSON.parse(l) as { id?: number; result?: { tools?: unknown[]; content?: { text?: string }[] } };
        } catch {
          return {};
        }
      });
      const tools = replies.find((r) => r.id === 2)?.result?.tools ?? [];
      const eventsFile = join(workspace, '.buildbrief', 'events.jsonl');
      const landed = existsSync(eventsFile) && readFileSync(eventsFile, 'utf8').includes(marker);
      destination = tools.length !== EXPECTED_TOOL_COUNT || !landed
        ? `${target}?test=error&detail=${encodeURIComponent(`Expected ${EXPECTED_TOOL_COUNT} tools and a landed capture; got ${tools.length} tools, landed=${landed}.`)}`
        : `${target}?test=pass&detail=${encodeURIComponent(`${tools.length} tools listed, capture landed in a disposable ledger.`)}`;
    }
  } catch (e) {
    destination = `${target}?test=error&detail=${encodeURIComponent(`Test harness failed: ${(e as Error).message.slice(0, 160)}`)}`;
  }
  redirect(destination);
}
