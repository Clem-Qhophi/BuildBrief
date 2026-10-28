/**
 * Minimal MCP stdio server: newline-delimited JSON-RPC 2.0 on stdin/stdout.
 * Implements initialize, notifications/initialized, tools/list, tools/call.
 * Tool calls delegate to the tested `bb` CLI in a child process, so the MCP
 * surface can never drift from CLI behavior. Logs go to stderr only —
 * stdout carries JSON-RPC frames exclusively.
 */
import { findTool, runTool, TOOLS } from './tools.js';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'build-brief', version: '0.1.0' };

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function result(id: RpcRequest['id'], value: unknown): string {
  return JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result: value });
}

function failure(id: RpcRequest['id'], code: number, message: string): string {
  return JSON.stringify({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

async function handle(req: RpcRequest): Promise<string | null> {
  if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
    return failure(req.id, -32600, 'invalid JSON-RPC request');
  }
  switch (req.method) {
    case 'initialize':
      return result(req.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case 'notifications/initialized':
      return null;
    case 'ping':
      return result(req.id, {});
    case 'tools/list':
      return result(req.id, {
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      });
    case 'tools/call': {
      const params = req.params ?? {};
      const name = params['name'];
      if (typeof name !== 'string') return failure(req.id, -32602, 'tools/call requires params.name');
      const tool = findTool(name);
      if (tool === undefined) return failure(req.id, -32602, `unknown tool '${name}'`);
      const args = (params['arguments'] ?? {}) as Record<string, unknown>;
      try {
        const out = await runTool(tool, args);
        return result(req.id, { content: [{ type: 'text', text: out.text }], isError: out.isError });
      } catch (e) {
        return result(req.id, { content: [{ type: 'text', text: `tool host error: ${(e as Error).message}` }], isError: true });
      }
    }
    default:
      // Notifications (no id) are acknowledged silently; unknown methods error.
      if (req.id === undefined || req.id === null) return null;
      return failure(req.id, -32601, `method not found: ${req.method}`);
  }
}

export async function serve(stdin: NodeJS.ReadableStream, stdout: NodeJS.WritableStream): Promise<void> {
  let buffer = '';
  stdin.setEncoding('utf8');
  for await (const chunk of stdin) {
    buffer += String(chunk);
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const text = line.trim();
      if (text.length === 0) continue;
      let req: RpcRequest;
      try {
        req = JSON.parse(text) as RpcRequest;
      } catch {
        stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } })}\n`);
        continue;
      }
      try {
        const reply = await handle(req);
        if (reply !== null) stdout.write(`${reply}\n`);
      } catch (e) {
        stdout.write(`${failure(req.id, -32603, `internal error: ${(e as Error).message}`)}\n`);
      }
    }
  }
}

export function toolNames(): string[] {
  return TOOLS.map((t) => t.name);
}
