import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Extra argv appended from string arguments, in order. */
  args: string[];
}

export function cliMainPath(): string {
  // packages/mcp/dist/src/tools.js -> packages/cli/dist/src/main.js
  const fallback = fileURLToPath(new URL('../../../cli/dist/src/main.js', import.meta.url));
  const p = resolve(process.env['BB_CLI'] ?? fallback);
  if (!existsSync(p)) throw new Error(`bb CLI not found at ${p} (set BB_CLI)`);
  return p;
}

export function workspaceRoot(): string {
  return resolve(process.env['BB_WORKSPACE'] ?? process.cwd());
}

export const TOOLS: ToolDef[] = [
  {
    name: 'bb_capture',
    description: 'Capture a raw user prompt as a draft intent candidate. Never approves. Returns the draft intent id.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        feature: { type: 'string' },
        prompt: { type: 'string' },
        agent: { type: 'string' },
        session: { type: 'string' },
      },
      required: ['project', 'prompt'],
    },
    args: ['capture'],
  },
  {
    name: 'bb_list_intents',
    description: 'List intent versions and states for a project.',
    inputSchema: {
      type: 'object',
      properties: { project: { type: 'string' } },
      required: ['project'],
    },
    args: ['list'],
  },
  {
    name: 'bb_approve_intent',
    description: 'Owner approval of a draft intent version. Requires an authenticated actor name. This is the ONLY path to authoritative intent.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        intent: { type: 'string' },
        actor: { type: 'string' },
      },
      required: ['project', 'intent', 'actor'],
    },
    args: ['approve'],
  },
  {
    name: 'bb_get_context',
    description: 'Alias for listing current approved constraints: lists intents (approved states carry the binding contract).',
    inputSchema: {
      type: 'object',
      properties: { project: { type: 'string' } },
      required: ['project'],
    },
    args: ['list'],
  },
  {
    name: 'bb_verify',
    description: 'Verify an approved intent against a repository revision. Returns findings with evidence citations plus possibly-unrequested changes.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        intent: { type: 'string' },
        repo: { type: 'string' },
        base: { type: 'string' },
        provider: { type: 'string', enum: ['rules', 'mock', 'meta'] },
      },
      required: ['project', 'intent'],
    },
    args: ['verify'],
  },
  {
    name: 'bb_report',
    description: 'Render a stored verification report as markdown, JSON, or HTML.',
    inputSchema: {
      type: 'object',
      properties: {
        run: { type: 'string' },
        format: { type: 'string', enum: ['md', 'json', 'html'] },
      },
      required: ['run'],
    },
    args: ['report'],
  },
  {
    name: 'bb_make_fix_brief',
    description: 'Build bounded correction packs for a verification run. Advice only: never a patch, never auto-applied.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        run: { type: 'string' },
      },
      required: ['project', 'run'],
    },
    args: ['fix'],
  },
  {
    name: 'bb_explain',
    description: 'Explain a verified feature from its approved intent and verification report. Grounded in evidence; unknowns explicit.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        intent: { type: 'string' },
        run: { type: 'string' },
      },
      required: ['project', 'intent', 'run'],
    },
    args: ['explain'],
  },
  {
    name: 'bb_quiz',
    description: 'Generate locate/predict quiz questions from verified findings. Locate answers are graded mechanically; open answers await human grading.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        intent: { type: 'string' },
        run: { type: 'string' },
        types: { type: 'string' },
      },
      required: ['project', 'intent', 'run'],
    },
    args: ['quiz'],
  },
  {
    name: 'bb_tour',
    description: 'Role-targeted brief (founder, engineer, marketing, ...) from intent plus findings. Business policy is never invented.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        intent: { type: 'string' },
        run: { type: 'string' },
        role: { type: 'string' },
      },
      required: ['project', 'intent', 'run'],
    },
    args: ['tour'],
  },
  {
    name: 'bb_map',
    description: 'Comprehension map: per-criterion status from recorded quiz activity. Only current-revision, non-retired answers count; gaps show as untested, stale, or unmeasured.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        intent: { type: 'string' },
        repo: { type: 'string' },
      },
      required: ['project', 'intent'],
    },
    args: ['map'],
  },
  {
    name: 'bb_autopsy',
    description: 'Prompt autopsy: groups 2+ failed attempts per criterion into Observed facts / Plausible causes / Unknowns plus one scoped next prompt. Single failures are referred to bb_make_fix_brief.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        intent: { type: 'string' },
        criterion: { type: 'string' },
      },
      required: ['project', 'intent'],
    },
    args: ['autopsy'],
  },
];

const FLAG_FOR: Record<string, string> = {
  project: 'project',
  feature: 'feature',
  prompt: 'prompt',
  agent: 'agent',
  session: 'session',
  intent: 'intent',
  actor: 'actor',
  repo: 'repo',
  base: 'base',
  provider: 'provider',
  run: 'run',
  format: 'format',
  types: 'types',
  role: 'role',
  criterion: 'criterion',
};

export interface ToolResult {
  text: string;
  isError: boolean;
}

/** Executes one bb tool by delegating to the tested CLI in a child process. */
export function runTool(tool: ToolDef, args: Record<string, unknown>): Promise<ToolResult> {
  const argv: string[] = [...tool.args];
  for (const [key, flag] of Object.entries(FLAG_FOR)) {
    const v = args[key];
    if (typeof v === 'string' && v.length > 0) argv.push(`--${flag}`, v);
  }
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [cliMainPath(), ...argv],
      { cwd: workspaceRoot(), timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error !== null) {
          const msg = (stderr.trim() || stdout.trim() || error.message).slice(0, 2000);
          resolve({ text: `bb ${tool.args[0]} failed: ${msg}`, isError: true });
          return;
        }
        resolve({ text: stdout.trim().slice(0, 8000), isError: false });
      },
    );
  });
}

export function findTool(name: string): ToolDef | undefined {
  return TOOLS.find((t) => t.name === name);
}
