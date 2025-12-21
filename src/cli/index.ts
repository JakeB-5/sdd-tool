/**
 * CLI 진입점
 */
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { registerInitCommand } from './commands/init.js';
import { registerValidateCommand } from './commands/validate.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string; description: string };

const program = new Command();

program
  .name('sdd')
  .description(pkg.description)
  .version(pkg.version);

// Commands
registerInitCommand(program);
registerValidateCommand(program);

/**
 * CLI 실행
 */
export function run(): void {
  program.parse();
}

export { program };
