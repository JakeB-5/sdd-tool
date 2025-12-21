/**
 * CLI 진입점
 */
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { registerInitCommand } from './commands/init.js';
import { registerValidateCommand } from './commands/validate.js';
import { registerPromptCommand } from './commands/prompt.js';
import { registerChangeCommand } from './commands/change.js';
import { registerImpactCommand } from './commands/impact.js';
import { registerNewCommand } from './commands/new.js';
import { registerStatusCommand } from './commands/status.js';
import { registerListCommand } from './commands/list.js';
import { registerConstitutionCommand } from './commands/constitution.js';
import { registerStartCommand } from './commands/start.js';
import { registerMigrateCommand } from './commands/migrate.js';
import { registerCicdCommand } from './commands/cicd.js';
import { registerTransitionCommand } from './commands/transition.js';

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
registerPromptCommand(program);
registerChangeCommand(program);
registerImpactCommand(program);
registerNewCommand(program);
registerStatusCommand(program);
registerListCommand(program);
registerConstitutionCommand(program);
registerStartCommand(program);
registerMigrateCommand(program);
registerCicdCommand(program);
registerTransitionCommand(program);

/**
 * CLI 실행
 */
export function run(): void {
  program.parse();
}

export { program };
