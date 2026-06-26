/**
 * sdd-chat skill definition — interactive SDD assistant for conversational spec work.
 */
import type { SkillDefinition } from '../types.js';

export const sddChatSkill: SkillDefinition = {
  name: 'sdd-chat',
  description: 'Interactive SDD assistant for conversational spec work',
  allowedTools: ['Read', 'Glob'],
  context: 'inline',
  disableModelInvocation: true,
  content: `# SDD Chat

## Overview

An interactive interface for performing SDD work through natural language.
Ask questions, write specs, review documents, and execute commands — all through conversation.

## Conversation Modes

### 1. Ask Mode

Ask questions about SDD or the current project:
- "What are the dependencies for this spec?"
- "How do I use RFC 2119 keywords?"
- "What should I do next?"

### 2. Write Mode

Compose specs and documents conversationally:
- "Write a new feature spec for me"
- "Turn these requirements into scenarios"
- "Help me write plan.md"

### 3. Review Mode

Review existing specs and provide feedback:
- "Review spec.md"
- "Does this scenario look right?"
- "Are my RFC 2119 keywords used correctly?"

### 4. Execute Mode

Run SDD commands on your behalf:
- "Validate the specs"
- "Run impact analysis"
- "Show me the list of change proposals"

## Context Tracking

During the conversation the following are tracked automatically:
- The spec currently being worked on
- Recently executed commands
- Issues discovered
- Suggested next steps

## Example Session

**Starting the conversation:**
> I want to build a new authentication feature

**Response:**
1. What is the feature name and description?
2. What are the main requirements?
3. Which authentication method will be used?

**Continuing:**
> Email and password auth. Social login can come later.

**Response:**
Writing a basic authentication spec...
[spec.md authoring begins]

## Ending the Session

To end the conversation:
- Type "done" or "exit"
- Invoke a different slash command
`,
};
