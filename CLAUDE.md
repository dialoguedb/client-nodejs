# DialogueDB Client SDK

TypeScript SDK for DialogueDB. Published as `dialogue-db` on npm.

## Commands

```bash
npm test                  # Run tests (Jest)
npm run build             # Compile TypeScript
npm run build:package     # Build dist (cjs + esm + types via tsup)
npm run format:write      # Prettier
```

## Structure

```
src/
├── index.ts              # Public API exports
├── dialogue/
│   ├── class.dialogue-db.ts  # DialogueDB - main entry class
│   ├── class.dialogue.ts     # Dialogue - single conversation
│   ├── class.message.ts      # Message wrapper
│   └── class.memory.ts       # Memory wrapper
├── api/                  # Low-level REST client (dialogue, message, messages, memory, search)
├── methods/              # High-level methods (createDialogue, getDialogue, listDialogues, etc.)
├── settings/             # Config and settings management
├── types/                # TypeScript type definitions
├── errors/               # Error classes
└── utils/                # Request helpers, validation
```

## Key Concepts

- **Messages** post immediately via `addMessage()` / `addMessages()`
- **State/metadata** changes are batched locally, persisted via `dialogue.save()`
- `dialogue.isDirty` indicates unsaved changes
- `createConfig({ apiKey })` sets global config
- Both class-based (`new DialogueDB()`) and functional (`createDialogue()`) APIs are exported
- Raw API methods exposed via `api.dialogue.*`, `api.message.*`, `api.memory.*`, `api.search.*`

## Testing

Tests are co-located with source files (`*.test.ts`). Run with `npm test`.
