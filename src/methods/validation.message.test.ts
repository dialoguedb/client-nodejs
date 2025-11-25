import {
  isCreateMessageInput,
  isGetMessageInput,
  isListMessageFilters,
} from "./validation.message";

describe("validation.message", () => {
  describe("isCreateMessageInput", () => {
    it("should pass with valid input", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello world",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(true);
    });

    it("should fail when missing dialogueId", () => {
      const input = {
        role: "user",
        content: "Hello world",
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Missing required 'dialogueId'");
    });

    it("should fail when missing role", () => {
      const input = {
        dialogueId: "dialogue-123",
        content: "Hello world",
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Missing required 'role'");
    });

    it("should fail when missing content", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Missing required 'content'");
    });

    it("should fail when dialogueId is not a string", () => {
      const input = {
        dialogueId: 123,
        role: "user",
        content: "Hello",
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'dialogueId' must be a string");
    });

    it("should fail when dialogueId is too short", () => {
      const input = {
        dialogueId: "abc",
        role: "user",
        content: "Hello",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe(
        "Property 'dialogueId' must have a length greater than 4"
      );
    });

    it("should fail when role is not a string", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: 123,
        content: "Hello",
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'role' must be a string");
    });

    it("should fail when role is too short", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "ab",
        content: "Hello",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe(
        "Property 'role' must have a length greater than 3"
      );
    });

    it("should fail when id is not a string", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        id: 123,
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'id' must be a string");
    });

    it("should fail when id is too short", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        id: "abc",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'id' must have a length greater than 4");
    });

    it("should pass with valid id", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        id: "message-123",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(true);
    });

    it("should fail when name is not a string", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        name: 123,
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'name' must be a string");
    });

    it("should pass with valid name", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        name: "Tool Call",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(true);
    });

    it("should fail when tags is not an array", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        tags: "not-an-array",
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'tags' must be an array");
    });

    it("should fail when tags has more than 10 items", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        tags: Array(11).fill("tag"),
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe(
        "Property 'tags' must have a length less than or equal to 10"
      );
    });

    it("should pass with valid tags", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        tags: ["tag1", "tag2"],
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(true);
    });

    it("should fail when metadata is not an object", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        metadata: "not-an-object",
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'metadata' must be an object");
    });

    it("should fail when metadata is an array", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        metadata: [],
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'metadata' must be an object");
    });

    it("should pass with valid metadata", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        metadata: { key: "value" },
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(true);
    });

    it("should fail when created is not a string", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        created: 123,
      } as any;
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'created' must be a string");
    });

    it("should fail when created is not an ISO string", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        created: "not-an-iso-string",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Property 'created' should be an ISO 8601 string");
    });

    it("should pass with valid created ISO string", () => {
      const input = {
        dialogueId: "dialogue-123",
        role: "user",
        content: "Hello",
        created: "2024-01-01T00:00:00.000Z",
      };
      const result = isCreateMessageInput(input);
      expect(result[0]).toBe(true);
    });
  });

  describe("isGetMessageInput", () => {
    it("should pass with valid input", () => {
      const input = {
        dialogueId: "dialogue-123",
        id: "message-123",
      };
      const result = isGetMessageInput(input);
      expect(result[0]).toBe(true);
    });

    it("should fail when missing dialogueId", () => {
      const input = {
        id: "message-123",
      } as any;
      const result = isGetMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Missing required 'dialogueId'");
    });

    it("should fail when missing id", () => {
      const input = {
        dialogueId: "dialogue-123",
      } as any;
      const result = isGetMessageInput(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Missing required 'id'");
    });
  });

  describe("isListMessageFilters", () => {
    it("should pass with valid input", () => {
      const input = {
        dialogueId: "dialogue-123",
      };
      const result = isListMessageFilters(input);
      expect(result[0]).toBe(true);
    });

    it("should fail when missing dialogueId", () => {
      const input = {} as any;
      const result = isListMessageFilters(input);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe("Missing required 'dialogueId'");
    });

    it("should pass with valid dialogueId and optional fields", () => {
      const input = {
        dialogueId: "dialogue-123",
        limit: 10,
        next: "token",
      };
      const result = isListMessageFilters(input);
      expect(result[0]).toBe(true);
    });
  });
});
