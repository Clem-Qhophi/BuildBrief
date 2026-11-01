import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AgentSetup {
  id: 'muse' | 'codex' | 'claude';
  name: string;
  version: string | null;
  /** How this agent registers a stdio MCP server (verified via --help) or why not. */
  mcpMethod: string;
  /** Copy-paste registration command, or null when the agent offers none. */
  mcpCommand: string | null;
  mcpVerified: boolean;
  hooksNote: string;
  capabilities: string[];
}

/**
 * Absolute path to the built MCP stdio server. Found by walking up from
 * this file (works in dev, tests, and the production bundle alike).
 */
export function mcpServerPath(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'packages', 'mcp', 'dist', 'src', 'serve.js');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('MCP server not built: run npm run build first.');
}

function probeBin(bin: string, timeoutMs = 4000): string | null {
  const candidates = process.platform === 'win32' ? [bin, `${bin}.cmd`] : [bin];
  for (const candidate of candidates) {
    try {
      const run = process.platform === 'win32' && candidate.endsWith('.cmd')
        ? execFileSync('cmd.exe', ['/c', candidate, '--version'], { encoding: 'utf8', timeout: timeoutMs })
        : execFileSync(candidate, ['--version'], { encoding: 'utf8', timeout: timeoutMs });
      const first = String(run).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)[0];
      if (first !== undefined) return first;
    } catch {
      continue;
    }
  }
  return null;
}

/** Installed versions, or null per agent. Never throws. */
export function detectAgents(): Record<'muse' | 'codex' | 'claude', string | null> {
  return { muse: probeBin('muse'), codex: probeBin('codex'), claude: probeBin('claude') };
}

export function agentSetups(serverPath: string, versions: Record<'muse' | 'codex' | 'claude', string | null>): AgentSetup[] {
  return [
    {
      id: 'muse',
      name: 'Muse Code',
      version: versions.muse,
      mcpMethod: 'No stdio registration command: `muse mcp` only handles OAuth login/logout for streamable-HTTP entries in settings.json. Register by editing settings.json manually (unverified — report back whether it connects).',
      mcpCommand: null,
      mcpVerified: false,
      hooksNote: 'UserPromptSubmit fires (verified live). Stop does not fire on this build — no live blocking (ADR-024, ADR-025).',
      capabilities: ['MCP tools (via manual settings.json entry, unverified)', 'prompt capture hook (verified)', 'constraint guard (advisory only)'],
    },
    {
      id: 'codex',
      name: 'Codex CLI',
      version: versions.codex,
      mcpMethod: 'Verified CLI syntax (`codex mcp add --help`): stdio servers register with `codex mcp add <NAME> -- <COMMAND>`.',
      mcpCommand: `codex mcp add buildbrief -- node ${serverPath}`,
      mcpVerified: true,
      hooksNote: 'Hook firing not yet probed on this machine — capture path unverified for codex.',
      capabilities: ['MCP tools (registration syntax verified; in-agent run still needs an owner test)', 'hooks (unverified)'],
    },
    {
      id: 'claude',
      name: 'Claude Code',
      version: versions.claude,
      mcpMethod: 'Verified CLI syntax (`claude mcp --help`): stdio servers register with `claude mcp add <name> -- <command> [args]`.',
      mcpCommand: `claude mcp add buildbrief -- node ${serverPath}`,
      mcpVerified: true,
      hooksNote: 'Hook firing not yet probed on this machine — capture path unverified for claude.',
      capabilities: ['MCP tools (registration syntax verified; in-agent run still needs an owner test)', 'hooks (unverified)'],
    },
  ];
}

export const EXPECTED_TOOL_COUNT = 12;

/**
 * Downloadable setup guide. Contains the install path (functionally
 * required) but never secrets, ledger contents, or workspace data.
 */
export function buildMcpGuide(serverPath: string, versions: Record<'muse' | 'codex' | 'claude', string | null>): string {
  const setups = agentSetups(serverPath, versions);
  const lines = [
    '# BuildBrief MCP setup guide',
    '',
    'BuildBrief speaks MCP over stdio: your coding agent launches a local',
    'server that exposes 12 tools (`bb_capture` … `bb_autopsy`). The tools',
    'delegate to the tested `bb` CLI, so MCP behaviour always matches CLI',
    'behaviour. Nothing leaves your machine; no account needed.',
    '',
    `Server command: \`node ${serverPath}\``,
    '',
  ];
  for (const setup of setups) {
    lines.push(`## ${setup.name} (${setup.version ?? 'not detected on PATH'})`);
    lines.push('');
    lines.push(setup.mcpMethod);
    lines.push('');
    if (setup.mcpCommand !== null) {
      lines.push('```');
      lines.push(setup.mcpCommand);
      lines.push('```');
      lines.push('');
    }
    lines.push(`Hooks: ${setup.hooksNote}`);
    lines.push('');
    lines.push('Capabilities claimed only as listed; anything marked unverified needs an owner test.');
    lines.push('');
  }
  lines.push('## Verify');
  lines.push('');
  lines.push('1. List tools: the server must answer `tools/list` with 12 tools.');
  lines.push('2. Run `bb_list_intents` for a scratch project on a disposable workspace.');
  lines.push('3. Capture a draft (`bb_capture`) and confirm it lands in that workspace ledger.');
  lines.push('4. In-agent runs (prompting the agent to use the tools) still need one owner test per agent.');
  lines.push('');
  lines.push('## Troubleshoot');
  lines.push('');
  lines.push('- Server exits immediately: rebuild with `npm run build` and retry the exact command above.');
  lines.push('- Agent cannot find the server: use the absolute path shown, not a relative one.');
  lines.push('- Writes land in the wrong workspace: the server writes to `BB_WORKSPACE` or its working directory — set `BB_WORKSPACE` explicitly.');
  lines.push('- Never paste API keys into MCP configuration, guides, or ledgers; keys live in the environment only.');
  lines.push('');
  return lines.join('\n');
}
