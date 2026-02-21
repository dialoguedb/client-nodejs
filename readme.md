# DialogueDB Client SDK

[![Tests](https://github.com/dialoguedb/client-nodejs/actions/workflows/ci.yml/badge.svg)](https://github.com/dialoguedb/client-nodejs/actions/workflows/ci.yml) [![Coverage Status](https://coveralls.io/repos/github/dialoguedb/client-nodejs/badge.svg?branch=main)](https://coveralls.io/github/dialoguedb/client-nodejs?branch=main)
[![npm version](https://img.shields.io/npm/v/dialogue-db.svg)](https://www.npmjs.com/package/dialogue-db)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript SDK for DialogueDB - a managed database service for AI conversation management.

## Requirements

Node.js 18 or higher.

## Installation

```bash
npm install dialogue-db
```

## Quick Start

```typescript
import { DialogueDB } from "dialogue-db";

const db = new DialogueDB({ apiKey: process.env.DIALOGUE_DB_API_KEY });

// Create a dialogue with an initial message
const dialogue = await db.createDialogue({
  messages: [{ role: "user", content: "Hello!" }],
});

// Add a response
await dialogue.saveMessage({
  role: "assistant",
  content: "Hi there!",
});

// Update conversation state
await dialogue.saveState({
  topic: "greeting",
});
```

## Configuration

### Using the DialogueDB Class

```typescript
import { DialogueDB } from "dialogue-db";

const db = new DialogueDB({ apiKey: "your-api-key" });
```

### Using the Direct API

For simple CRUD operations or when you want full control:

```typescript
import { api, createConfig } from "dialogue-db";

createConfig({ apiKey: "your-api-key" });

// Direct API calls map closely to REST endpoints
const dialogue = await api.dialogue.create({ /* ... */ });
const messages = await api.messages.list({ dialogueId: "id" });
```

### Environment Variables

Set `DIALOGUE_DB_API_KEY` to configure automatically.

## Core Concepts

### Two Usage Patterns

The SDK offers two ways to interact with DialogueDB:

1. **DialogueDB Class** - Object-oriented interface with convenience methods, state management, and pagination handling
2. **Direct API** - Simple function calls that map 1:1 with REST endpoints, returning plain data objects

Use the class when you need stateful conversation management. Use the API when you want straightforward CRUD operations.

### Entities

- **Dialogue** - A conversation container with messages, state, and metadata
- **Message** - An individual message within a dialogue (role, content, metadata)
- **Memory** - Persistent storage for facts, preferences, or context that persists across conversations

## Working with Dialogues

### Creating a Dialogue

```typescript
const dialogue = await db.createDialogue({
  namespace: "my-app", // Optional grouping
  messages: [
    { role: "user", content: "Hello" },
  ],
  state: { context: "onboarding" },
  metadata: { userId: "123" },
  tags: ["new"],
});
```

### Getting a Dialogue

```typescript
const dialogue = await db.getDialogue("dialogue-id");

if (dialogue) {
  console.log(dialogue.messages);
}
```

### Saving Messages

Messages are persisted immediately:

```typescript
// Single message
const message = await dialogue.saveMessage({
  role: "assistant",
  content: "How can I help?",
});

// Multiple messages at once
const messages = await dialogue.saveMessages([
  { role: "user", content: "Question 1" },
  { role: "user", content: "Question 2" },
]);
```

### Loading Messages

Messages support pagination:

```typescript
// Initial load
await dialogue.loadMessages({ limit: 50 });

// Load more
if (dialogue.hasMoreMessages) {
  await dialogue.loadMessages({ limit: 50, next: true });
}
```

### Deleting Messages

```typescript
await dialogue.deleteMessage("message-id");
```

### Managing State

```typescript
// Set and save later
dialogue.state = { step: 2, context: "payment" };
await dialogue.save();

// Or save immediately
await dialogue.saveState({ step: 2, context: "payment" });
```

### Managing Tags

```typescript
// Set and save later
dialogue.tags = ["vip", "priority"];
await dialogue.save();

// Or save immediately
await dialogue.saveTags(["vip", "priority"]);
```

### Threading

Threads link related dialogues together. Use cases include:

- **Conversation branches** - Let users explore alternative responses
- **Agent reasoning** - Keep internal chain-of-thought separate from user-facing messages
- **Sub-tasks** - Track related but distinct conversation flows
- **Versioning** - Maintain history while starting fresh

```typescript
// Create a linked thread
const thread = await dialogue.createThread({
  metadata: { purpose: "internal-reasoning" },
});

// Get all threads for a dialogue
const threads = await dialogue.getThreads();
```

### Dialogue Properties

| Property    | Type        | Description                    |
| ----------- | ----------- | ------------------------------ |
| `id`        | `string`    | Unique identifier              |
| `namespace` | `string?`   | Multi-tenancy namespace        |
| `messages`  | `Message[]` | Array of messages              |
| `state`     | `object`    | Conversation state             |
| `tags`      | `string[]`  | Tags for filtering             |
| `metadata`  | `object`    | Additional metadata            |
| `created`   | `string`    | ISO timestamp                  |
| `modified`  | `string`    | ISO timestamp                  |

## Working with Messages

Messages are accessed through their parent dialogue:

```typescript
const messages = dialogue.messages;

for (const message of messages) {
  console.log(`${message.role}: ${message.content}`);
}
```

### Message Properties

| Property     | Type                           | Description              |
| ------------ | ------------------------------ | ------------------------ |
| `id`         | `string`                       | Unique identifier        |
| `dialogueId` | `string`                       | Parent dialogue ID       |
| `role`       | `string`                       | Message role             |
| `content`    | `string \| object \| object[]` | Message content          |
| `created`    | `string`                       | ISO timestamp            |
| `modified`   | `string`                       | ISO timestamp            |
| `metadata`   | `object`                       | Additional metadata      |
| `tags`       | `string[]`                     | Tags for filtering       |
| `name`       | `string?`                      | Optional display name    |

### Updating Message Tags

```typescript
const message = dialogue.messages[0];

// Set and save later
message.tags = ["reviewed"];
await message.save();

// Or save immediately
await message.saveTags(["reviewed"]);
```

### Removing a Message

```typescript
await message.remove(); // Deletes from API and removes from parent dialogue
```

## Working with Memories

Memories are searchable, persistent storage for information that should be recalled across conversations. Unlike dialogue state (which is scoped to a single conversation), memories persist independently and can be searched semantically.

Common use cases:
- **User preferences** - Theme, language, notification settings
- **Learned facts** - "User's name is Alice", "Prefers morning meetings"
- **Domain knowledge** - Product details, policies, FAQs your agent should remember

### Creating a Memory

```typescript
const memory = await db.createMemory({
  id: "user-preferences",
  value: { theme: "dark", language: "en" },
  label: "User Preferences",
  description: "Stores user UI preferences",
  tags: ["settings"],
});
```

### Getting a Memory

```typescript
const memory = await db.getMemory("user-preferences");

if (memory) {
  console.log(memory.value); // { theme: "dark", language: "en" }
}
```

### Memory Properties

| Property      | Type       | Description                      |
| ------------- | ---------- | -------------------------------- |
| `id`         | `string`   | Unique identifier                |
| `namespace`   | `string?`  | Multi-tenancy namespace          |
| `label`       | `string?`  | Human-readable label             |
| `description` | `string?`  | Description of the memory        |
| `value`       | `any`      | The stored value                 |
| `metadata`    | `object`   | Additional metadata              |
| `tags`        | `string[]` | Tags for filtering               |
| `created`     | `string`   | ISO timestamp                    |
| `modified`    | `string`   | ISO timestamp                    |

### Updating Memory Tags

```typescript
memory.tags = ["archived"];
await memory.save();

// Or immediately
await memory.saveTags(["archived"]);
```

### Removing a Memory

```typescript
await memory.remove();
```

## Search

Search uses semantic vector search to find relevant content by meaning, not just keywords.

```typescript
// Search dialogues
const dialogues = await db.searchDialogues("billing issue", {
  limit: 10,
  filter: { tags: ["support"] },
});

// Search messages
const messages = await db.searchMessages("password reset", {
  limit: 20,
});

// Search memories
const memories = await db.searchMemories("user preferences", {
  limit: 5,
});
```

### Search Options

```typescript
{
  limit?: number;              // Maximum results
  filter?: {
    tags?: string[];           // Filter by tags
    created?: string;          // Filter by creation date (ISO)
    createdYear?: number;      // Filter by year (e.g., 2025)
    createdMonth?: number;     // Filter by month (1-12)
    createdDay?: number;       // Filter by day (1-31)
    modified?: string;         // Filter by modification date (ISO)
    modifiedYear?: number;
    modifiedMonth?: number;
    modifiedDay?: number;
  };
  metadata?: Record<string, any>;  // Filter by custom metadata values
}
```

### Filtering by Metadata

Custom metadata you set on entities can be used as search filters:

```typescript
// Find messages from a specific user in January
const messages = await db.searchMessages("order status", {
  filter: {
    createdMonth: 1,
    createdYear: 2025,
  },
  metadata: { userId: "user_123" },
});
```

## Direct API

The direct API provides simple function calls that map closely to REST endpoints. Returns plain data objects (not class instances).

```typescript
import { api } from "dialogue-db";

// Dialogue operations
const dialogue = await api.dialogue.create({ /* ... */ });
const fetched = await api.dialogue.get("id");
const listed = await api.dialogue.list({ limit: 10 });
const updated = await api.dialogue.update({ id: "id", state: {} });
await api.dialogue.remove("id");

// Single message operations
const message = await api.message.create({
  dialogueId: "id",
  role: "user",
  content: "...",
});
await api.message.remove({ dialogueId: "id", id: "msg-id" });

// Bulk message operations
const messages = await api.messages.create({
  id: "dialogue-id",
  messages: [{ role: "user", content: "..." }],
});
const messageList = await api.messages.list({ dialogueId: "id" });

// Memory operations
const memory = await api.memory.create({ id: "k", value: "v" });
const mem = await api.memory.get("k");
await api.memory.update({ id: "k", value: "new-value" });
await api.memory.remove("k");

// Search
const results = await api.search({ query: "...", object: "dialogue" });
```

## TypeScript

The SDK is written in TypeScript with full type definitions.

### Core Interfaces

```typescript
interface IDialogue {
  id: string;
  projectId: string;
  requestId: string;
  status: "active" | "ended" | "archived";
  created: string;
  modified: string;
  tags: string[];

  // Optional fields
  namespace?: string;
  threadOf?: string;
  label?: string;
  state?: Record<string, any>;
  messages?: IMessage[];
  metadata?: Record<string, string | number | boolean>;
  totalMessages?: number;
  threadCount?: number;
}

interface IMessage {
  id: string;
  dialogueId: string;
  role: string;
  content: string | object | object[];
  created: string;
  modified: string;
  metadata: Record<string, string | number | boolean>;
  tags: string[];
  name?: string;
}

interface IMemory {
  id: string;
  value: string | number | boolean | object | any[];
  metadata: Record<string, string | number | boolean>;
  tags: string[];
  created: string;
  modified: string;
  namespace?: string;
  label?: string;
  description?: string;
}
```

### Input Types

```typescript
type CreateDialogueInput = {
  namespace?: string;
  threadOf?: string;
  label?: string;
  messages?: CreateMessageInput[];
  state?: Record<string, any>;
  metadata?: Record<string, string | number | boolean>;
  tags?: string[];
};

type CreateMessageInput = {
  role: string;
  content: string | object | object[];
  id?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
};

type CreateMemoryInput = {
  value: string | number | boolean | object | any[];
  id?: string;
  namespace?: string;
  label?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
};

type SearchOptions = {
  limit?: number;
  filter?: {
    tags?: string[];
    created?: string;
    createdYear?: number;
    createdMonth?: number;
    createdDay?: number;
    modified?: string;
    modifiedYear?: number;
    modifiedMonth?: number;
    modifiedDay?: number;
  };
  metadata?: Record<string, any>;
};
```

## Advanced

### Class vs Data Objects

When using the `DialogueDB` class methods, you get class instances with additional functionality:

```typescript
const db = new DialogueDB({ apiKey: "..." });
const dialogue = await db.getDialogue("id");

// Class instance has methods and state tracking
dialogue.state = { updated: true };
console.log(dialogue.isDirty); // true - tracks unsaved changes
await dialogue.save();
console.log(dialogue.isDirty); // false
```

When using the direct API, you get plain data objects:

```typescript
const data = await api.dialogue.get("id");
// data.isDirty - undefined (not a class instance)
```

### Save Behavior

The `Dialogue` class batches state and tag changes locally until you call `save()`:

```typescript
// Changes are batched
dialogue.state = { step: 1 };
dialogue.tags = ["important"];
await dialogue.save(); // Single API call saves both

// Or use immediate methods
await dialogue.saveState({ step: 1 }); // Saves immediately
await dialogue.saveTags(["important"]); // Saves immediately
```

Messages are always saved immediately via `saveMessage()` / `saveMessages()`.

### Pagination

The `Dialogue` class handles message pagination:

```typescript
const dialogue = await db.getDialogue("id");

// Check if more messages exist
if (dialogue.hasMoreMessages) {
  await dialogue.loadMessages({ limit: 50, next: true });
}
```

## Validation & Limits

### Input Validation

The API validates all inputs and returns descriptive errors:

- **Unknown query parameters** are rejected on list endpoints. The API will return an error if you pass query parameters that aren't supported.
- **Metadata must be flat** - nested objects are not allowed. Use only string, number, or boolean values.
- **Tags have a maximum length of 64 characters** per tag.
- **Dialogue IDs are always auto-generated** - any `id` field provided when creating a dialogue is ignored.
- **Message IDs can be provided** or will be auto-generated if omitted.

### Plan Limits

Your account plan determines resource limits for:

- API requests per month
- Number of dialogues and messages
- Storage capacity
- Features like semantic search and auto-summarization

When limits are exceeded, the API returns a `429` status with details about which limit was reached. Check your plan settings in the DialogueDB dashboard.

## License

MIT
