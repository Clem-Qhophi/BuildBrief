import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ledgerExists, workspaceRoot } from '../../../lib/ledger';

/** Export the raw ledger log. History is immutable — export, never edit. */
export async function GET(): Promise<Response> {
  const root = workspaceRoot();
  if (!ledgerExists(root)) return new Response('no ledger in this workspace', { status: 404 });
  const body = readFileSync(join(root, '.buildbrief', 'events.jsonl'), 'utf8');
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/x-ndjson',
      'content-disposition': 'attachment; filename="buildbrief-events.jsonl"',
    },
  });
}
