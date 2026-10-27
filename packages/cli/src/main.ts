#!/usr/bin/env node
import { parseArgs } from './args.js';
import {
  cmdApprove,
  cmdCapture,
  cmdFix,
  cmdList,
  cmdRecheck,
  cmdReport,
  cmdReverse,
  cmdVerify,
} from './commands.js';

const HELP = `bb — Build Brief CLI (intent → evidence → verdict)

  bb capture --project P --feature F --prompt "..." [--prompt-file F] [--agent A] [--session S] [--source manual|hook]
  bb list --project P
  bb approve --project P --intent ID --actor NAME
  bb verify --project P --intent ID [--repo DIR] [--provider rules|mock|meta] [--base SHA] [--format md|json|html] [--out FILE]
  bb recheck --project P --intent ID [same flags as verify]
  bb reverse --project P --intent ID --from SHA [--to SHA] [--repo DIR]
  bb fix --project P --run RUN_ID
  bb report --run RUN_ID [--format md|json|html] [--out FILE]

Ledger lives in ./.buildbrief (cwd). Reports in ./.buildbrief/reports.
Docs: docs/ARCHITECTURE.md · Decisions: docs/DECISIONS.md
`;

export async function main(argv: string[], cwd: string): Promise<number> {
  const args = parseArgs(argv);
  try {
    switch (args.command) {
      case 'capture':
        return cmdCapture(cwd, args);
      case 'list':
        return cmdList(cwd, args);
      case 'approve':
        return cmdApprove(cwd, args);
      case 'verify':
        return await cmdVerify(cwd, args);
      case 'recheck':
        return await cmdRecheck(cwd, args);
      case 'reverse':
        return cmdReverse(cwd, args);
      case 'fix':
        return cmdFix(cwd, args);
      case 'report':
        return cmdReport(cwd, args);
      case 'help':
      case '--help':
      case '-h':
        console.log(HELP);
        return 0;
      default:
        console.error(`unknown command '${args.command}'\n${HELP}`);
        return 2;
    }
  } catch (e) {
    console.error(`bb ${args.command}: ${(e as Error).message}`);
    return 1;
  }
}

const isMain = process.argv[1]?.endsWith('main.js') === true;
if (isMain) {
  main(process.argv.slice(2), process.cwd()).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      console.error(`bb: ${(e as Error).message}`);
      process.exitCode = 1;
    },
  );
}
