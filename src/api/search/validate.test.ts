import { DialogueDBError } from "@/errors";
import { validateSearchInput } from "./validate";
import { SearchInput } from "./index";

const base: SearchInput = { query: "hello", object: "dialogue" };

const expectInvalid = (input: any, fieldOrMsg?: string) => {
  let caught: unknown;
  try {
    validateSearchInput(input);
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(DialogueDBError);
  const err = caught as DialogueDBError;
  expect(err.code).toBe("INVALID_PARAMETER");
  if (fieldOrMsg) {
    expect(err.message).toContain(fieldOrMsg);
  }
};

describe("validateSearchInput", () => {
  describe("required fields", () => {
    it("accepts minimal valid input", () => {
      expect(() => validateSearchInput(base)).not.toThrow();
    });

    it("rejects missing query", () => {
      expectInvalid({ object: "dialogue" }, "query");
    });

    it("rejects empty query", () => {
      expectInvalid({ query: "", object: "dialogue" }, "query");
    });

    it("rejects unknown object", () => {
      expectInvalid({ query: "q", object: "thread" }, "object");
    });
  });

  describe("simple option fields", () => {
    it("accepts valid limit, namespace, timezone, orderBy, order", () => {
      expect(() =>
        validateSearchInput({
          ...base,
          limit: 25,
          namespace: "ns",
          timezone: "America/Chicago",
          orderBy: "created",
          order: "asc",
        })
      ).not.toThrow();
    });

    it("rejects non-positive limit", () => {
      expectInvalid({ ...base, limit: 0 }, "limit");
    });

    it("rejects non-integer limit", () => {
      expectInvalid({ ...base, limit: 1.5 }, "limit");
    });

    it("rejects invalid order", () => {
      expectInvalid({ ...base, order: "down" }, "order");
    });

    it("rejects invalid orderBy", () => {
      expectInvalid({ ...base, orderBy: "stars" }, "orderBy");
    });
  });

  describe("deprecated date-decomposition fields", () => {
    it.each([
      ["createdYear", { createdYear: 2025 }],
      ["createdMonth", { createdMonth: 3 }],
      ["createdDay", { createdDay: 15 }],
      ["createdTimestamp", { createdTimestamp: 1700000000 }],
      ["modifiedYear", { modifiedYear: 2025 }],
      ["modifiedMonth", { modifiedMonth: 3 }],
      ["modifiedDay", { modifiedDay: 15 }],
      ["modifiedTimestamp", { modifiedTimestamp: 1700000000 }],
    ])("rejects filter.%s with a migration hint", (key, filter) => {
      let caught: any;
      try {
        validateSearchInput({ ...base, filter: filter as any });
      } catch (e) {
        caught = e;
      }
      expect(caught.code).toBe("INVALID_PARAMETER");
      expect(caught.message).toContain(`filter.${key}`);
      const expectedReplacement = key.startsWith("created")
        ? "filter.created"
        : "filter.modified";
      expect(caught.message).toContain(expectedReplacement);
      expect(caught.message).toMatch(/gte/);
    });
  });

  describe("filter shape", () => {
    it("accepts bare ISO string", () => {
      expect(() =>
        validateSearchInput({
          ...base,
          filter: { created: "2025-03-01T00:00:00Z" },
        })
      ).not.toThrow();
    });

    it("accepts natural-language phrase", () => {
      expect(() =>
        validateSearchInput({
          ...base,
          filter: { created: "March 2025" },
          timezone: "America/Chicago",
        })
      ).not.toThrow();
    });

    it("accepts range object with gte/lt", () => {
      expect(() =>
        validateSearchInput({
          ...base,
          filter: {
            created: {
              gte: "2025-03-01T00:00:00Z",
              lt: "2025-04-01T00:00:00Z",
            },
          },
        })
      ).not.toThrow();
    });

    it("rejects unknown filter key", () => {
      expectInvalid(
        { ...base, filter: { whenever: "today" } as any },
        "filter.whenever"
      );
    });

    it("rejects unknown range key", () => {
      expectInvalid(
        { ...base, filter: { created: { between: "x" } } as any },
        "filter.created.between"
      );
    });

    it("rejects empty range object", () => {
      expectInvalid({ ...base, filter: { created: {} } }, "filter.created");
    });
  });

  describe("tags shape", () => {
    it("accepts string array", () => {
      expect(() =>
        validateSearchInput({ ...base, tags: ["a", "b"] })
      ).not.toThrow();
    });

    it("accepts operator object", () => {
      expect(() =>
        validateSearchInput({ ...base, tags: { $all: ["a", "b"] } })
      ).not.toThrow();
    });

    it("rejects non-string array entries", () => {
      expectInvalid({ ...base, tags: ["a", 1] as any }, "tags");
    });

    it("rejects unknown tag operator", () => {
      expectInvalid({ ...base, tags: { $weird: ["x"] } as any }, "tags.$weird");
    });

    it("rejects empty operator object", () => {
      expectInvalid({ ...base, tags: {} }, "tags");
    });

    it("rejects non-array operator operand", () => {
      expectInvalid({ ...base, tags: { $in: "x" } as any }, "tags.$in");
    });

    it("rejects empty bare tag array", () => {
      expectInvalid({ ...base, tags: [] }, "tags");
    });

    it("rejects empty $in tag array", () => {
      expectInvalid({ ...base, tags: { $in: [] } }, "tags.$in");
    });

    it("rejects empty tag strings", () => {
      expectInvalid({ ...base, tags: ["", "x"] }, "tags");
    });

    it("rejects empty tag strings inside operator object", () => {
      expectInvalid({ ...base, tags: { $all: ["x", ""] } }, "tags.$all");
    });
  });

  describe("metadata shape", () => {
    it("accepts primitive shorthand", () => {
      expect(() =>
        validateSearchInput({ ...base, metadata: { tier: "pro" } })
      ).not.toThrow();
    });

    it("accepts array shorthand", () => {
      expect(() =>
        validateSearchInput({
          ...base,
          metadata: { tiers: ["pro", "enterprise"] },
        })
      ).not.toThrow();
    });

    it("accepts operator object", () => {
      expect(() =>
        validateSearchInput({
          ...base,
          metadata: { tier: { $in: ["pro", "enterprise"] } },
        })
      ).not.toThrow();
    });

    it("rejects empty operator object", () => {
      expectInvalid({ ...base, metadata: { tier: {} } }, "metadata.tier");
    });

    it("rejects unknown metadata operator", () => {
      expectInvalid(
        { ...base, metadata: { tier: { $contains: "x" } } as any },
        "metadata.tier.$contains"
      );
    });

    it("rejects empty $in array", () => {
      expectInvalid(
        { ...base, metadata: { tier: { $in: [] } } },
        "metadata.tier.$in"
      );
    });

    it("rejects mixed-type $in array", () => {
      expectInvalid(
        { ...base, metadata: { tier: { $in: ["pro", 1] } } as any },
        "metadata.tier.$in"
      );
    });

    it("rejects mixed-type array shorthand", () => {
      expectInvalid(
        { ...base, metadata: { tier: ["pro", 1] } as any },
        "metadata.tier"
      );
    });

    it("rejects empty bare-array shorthand", () => {
      expectInvalid({ ...base, metadata: { tier: [] } }, "metadata.tier");
    });

    it("rejects null inside metadata array shorthand", () => {
      expectInvalid(
        { ...base, metadata: { tier: [null] } as any },
        "metadata.tier"
      );
    });

    it("rejects object inside metadata array shorthand", () => {
      expectInvalid(
        { ...base, metadata: { tier: [{}] } as any },
        "metadata.tier"
      );
    });

    it("rejects null inside metadata $in", () => {
      expectInvalid(
        { ...base, metadata: { tier: { $in: [null] } } as any },
        "metadata.tier.$in"
      );
    });

    describe("scalar metadata operators", () => {
      it.each([
        ["$eq", "pro"],
        ["$ne", 1],
        ["$gt", 5],
        ["$gte", "2025-01-01"],
        ["$lt", 100],
        ["$lte", "z"],
      ])("accepts valid %s operand", (op, operand) => {
        expect(() =>
          validateSearchInput({
            ...base,
            metadata: { tier: { [op]: operand } } as any,
          })
        ).not.toThrow();
      });

      it.each([
        ["$eq", null],
        ["$eq", {}],
        ["$eq", [1, 2, 3]],
        ["$ne", null],
        ["$ne", undefined],
        ["$ne", [{}]],
      ])("rejects non-primitive operand for %s", (op, operand) => {
        expectInvalid(
          {
            ...base,
            metadata: { tier: { [op]: operand } } as any,
          },
          `metadata.tier.${op}`
        );
      });

      it.each([
        ["$gt", null],
        ["$gt", true],
        ["$gt", {}],
        ["$gt", [1, 2, 3]],
        ["$gte", false],
        ["$lt", null],
        ["$lte", []],
      ])("rejects non-number/string operand for %s", (op, operand) => {
        expectInvalid(
          {
            ...base,
            metadata: { tier: { [op]: operand } } as any,
          },
          `metadata.tier.${op}`
        );
      });
    });
  });
});
