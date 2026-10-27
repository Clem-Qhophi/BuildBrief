export interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

/** Minimal argv parser: `bb <cmd> [pos…] [--key value|--flag]`. No dependencies. */
export function parseArgs(argv: string[]): ParsedArgs {
  const [command = 'help', ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let i = 0;
  while (i < rest.length) {
    const tok = rest[i] as string;
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true;
        i += 1;
      } else {
        flags[key] = next;
        i += 2;
      }
    } else {
      positional.push(tok);
      i += 1;
    }
  }
  return { command, positional, flags };
}

export function flag(args: ParsedArgs, name: string, fallback = ''): string {
  const v = args.flags[name];
  if (typeof v === 'string') return v;
  return fallback;
}

export function requireFlag(args: ParsedArgs, name: string): string {
  const v = flag(args, name);
  if (v === '') throw new Error(`missing required --${name}`);
  return v;
}
