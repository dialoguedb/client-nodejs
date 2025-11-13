# DialogueDB Client SDK

[![npm version](https://img.shields.io/npm/v/dialogue-db.svg)](https://www.npmjs.com/package/dialogue-db)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript/JavaScript SDK for DialogueDB - a managed database service for AI conversation management.

## Documentation

See the [DialogueDB API docs](https://docs.dialoguedb.com) for complete documentation.

## Requirements

Node.js 18 or higher.

## Installation

```bash
npm install dialogue-db
```

## Usage

```typescript
import { createConfig, createDialogue } from "dialogue-db";

// Configure with your API key
createConfig({
  apiKey: process.env.DIALOGUE_DB_API_KEY
});

// Create a dialogue
const dialogue = await createDialogue({
  id: "conversation-123",
  namespace: "my-app",
  messages: [
    { role: "user", content: "Hello!" }
  ]
});

// Add a message
await dialogue.addMessage({
  role: "assistant",
  content: "Hi there!"
});

// Update state
dialogue.setState({ topic: "greeting" });
await dialogue.save();
```

## Configuration

The SDK can be configured with `createConfig()`:

```typescript
createConfig({
  apiKey: "your-api-key"  // Required: Your DialogueDB API key
});
```

Alternatively, set the `DIALOGUE_DB_API_KEY` environment variable.

## API Reference

### Core Methods

#### `createDialogue(options)`

Creates a new dialogue.

```typescript
const dialogue = await createDialogue({
  id?: string,              // Unique identifier (auto-generated if omitted)
  namespace?: string,       // Namespace for multi-tenancy
  messages?: Message[],     // Initial messages
  state?: object,           // Conversation state
  metadata?: object,        // Additional metadata
  tags?: string[],          // Tags for filtering
  expiresTimestamp?: number // Unix timestamp for expiration
});
```

#### `getDialogue(id, namespace?)`

Retrieves an existing dialogue.

```typescript
const dialogue = await getDialogue("conversation-123", "my-app");
```

#### `listDialogues(options)`

Lists dialogues with optional filters.

```typescript
const dialogues = await listDialogues({
  limit: 20,
  order: "desc",
  date: "2024-01-01"
});
```

#### `useDialogue(id, namespace?)`

Returns a Dialogue instance for manipulation.

```typescript
const dialogue = await useDialogue("conversation-123");
```

### Dialogue Methods

#### `addMessage(message)`

Adds a single message (posts immediately).

```typescript
await dialogue.addMessage({
  role: "user",
  content: "Hello!"
});
```

#### `addMessages(messages)`

Adds multiple messages (parallel API calls).

```typescript
await dialogue.addMessages([
  { role: "user", content: "Hello!" },
  { role: "assistant", content: "Hi!" }
]);
```

#### `loadMessages(options)`

Loads messages with pagination support.

```typescript
await dialogue.loadMessages({ limit: 50 });

// Pagination
if (dialogue.hasMoreMessages) {
  await dialogue.loadMessages({ next: dialogue.nextToken });
}
```

#### `deleteMessage(messageId)`

Deletes a message.

```typescript
await dialogue.deleteMessage("message-id");
```

#### `setState(state)`

Updates conversation state (batched until save).

```typescript
dialogue.setState({ context: "booking", step: 2 });
```

#### `getState()`

Returns current state.

```typescript
const state = dialogue.getState();
```

#### `save()`

Persists state and metadata changes.

```typescript
await dialogue.save();

// Check for unsaved changes
if (dialogue.isDirty) {
  await dialogue.save();
}
```

#### `createThread(options)`

Creates a child thread.

```typescript
const thread = await dialogue.createThread({
  metadata: { topic: "specific-question" },
  tags: ["thread"]
});
```

#### `getThreads()`

Retrieves all child threads.

```typescript
const threads = await dialogue.getThreads();
```

### Message Properties

Access current messages via:

```typescript
const messages = dialogue.messages;
```

Pagination properties:

```typescript
dialogue.hasMoreMessages  // boolean
dialogue.nextToken        // string | undefined
```

### Low-Level API

For advanced use cases, access the raw API:

```typescript
import { api } from "dialogue-db";

// Dialogue operations
await api.dialogue.create(payload);
await api.dialogue.get(id);
await api.dialogue.list(query);
await api.dialogue.update(updates);
await api.dialogue.remove(id);

// Message operations
await api.message.create(dialogueId, message);
await api.messages.list(dialogueId, options);
await api.message.remove(dialogueId, messageId);
```

## TypeScript

The SDK is written in TypeScript and includes type definitions.

```typescript
export interface IDialogue {
  id: string;
  namespace?: string;
  canceled?: boolean;
  expired: boolean;
  expiresTimestamp?: number;
  state: Record<string, any>;
  messages: IMessage[];
  metadata: Record<string, string | number | boolean>;
  tags: string[];
  created: string;
  modified: string;
}
```

```typescript
interface IMessage {
  id: string;
  role: string;
  content: string;
  namespace: string;
  created: string;
  modified: string;
  tags: string[];
  metadata: Record<string, string | number | boolean>;
}
```

## License

MIT
