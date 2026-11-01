import { buildMcpGuide, detectAgents, mcpServerPath } from '../../../../lib/agent-setup';

/** Downloadable MCP setup guide. Generated per request; contains no secrets or ledger data. */
export async function GET(): Promise<Response> {
  const body = buildMcpGuide(mcpServerPath(), detectAgents());
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': 'attachment; filename="buildbrief-mcp-setup.md"',
    },
  });
}
