/**
 * CLI 진입점
 */
import { Command } from 'commander';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string; description: string };

const program = new Command();

program
  .name('sdd')
  .description(pkg.description)
  .version(pkg.version);

// Commands will be registered here
// import { registerInitCommand } from './commands/init.js';
// registerInitCommand(program);

/**
 * CLI 실행
 */
export function run(): void {
  program.parse();
}

export { program };
