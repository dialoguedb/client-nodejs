# DialogueDB Client SDK

[![Tests](https://github.com/dialoguedb/client-nodejs/actions/workflows/ci.yml/badge.svg)](https://github.com/dialoguedb/client-nodejs/actions/workflows/ci.yml) [![Coverage Status](https://coveralls.io/repos/github/dialoguedb/client-nodejs/badge.svg?branch=12-github-actions-workflows)](https://coveralls.io/github/dialoguedb/client-nodejs?branch=12-github-actions-workflows)
[![npm version](https://img.shields.io/npm/v/dialogue-db.svg)](https://www.npmjs.com/package/dialogue-db)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript SDK for [DialogueDB](https://dialoguedb.com) — managed infrastructure for AI conversations.

## Installation

```bash
npm install dialogue-db
```

Requires Node.js 18+.

## Quick Start

```typescript
import { DialogueDB } from 'dialogue-db';

const db = new DialogueDB({ apiKey: process.env.DIALOGUE_DB_API_KEY });

// Create a dialogue with an initial message
const dialogue = await db.createDialogue({
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Add a response (saved immediately)
await dialogue.saveMessage({
  role: 'assistant',
  content: 'Hi there!'
});

// Update conversation state
await dialogue.saveState({ topic: 'greeting' });
```

## Documentation

Full SDK documentation is available at **[docs.dialoguedb.com/sdk/overview](https://docs.dialoguedb.com/sdk/overview)**:

- [Overview & Configuration](https://docs.dialoguedb.com/sdk/overview) — Installation, settings, usage patterns
- [Dialogues](https://docs.dialoguedb.com/sdk/dialogue) — DialogueDB class, Dialogue class, threading
- [Messages](https://docs.dialoguedb.com/sdk/messages) — Message class, content types, pagination
- [Memory & Search](https://docs.dialoguedb.com/sdk/memory) — Memory management, semantic search, direct API

## Environment Variables

Set `DIALOGUE_DB_API_KEY` to configure the SDK automatically without passing it to the constructor.

## License

MIT
