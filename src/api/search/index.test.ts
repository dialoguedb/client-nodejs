import { SettingsContainer } from "@/settings/class.SettingsContainer";
import { apiRequest } from "@/utils/request";
import { getConfig } from "@/settings";
import { search, SearchInput, SearchResponse } from "./index";
import { IMessage } from "@/types";

jest.mock("@/utils/request", () => {
  const actual = jest.requireActual("@/utils/request");
  return {
    ...actual,
    apiRequest: jest.fn(),
  };
});

jest.mock("@/settings", () => {
  const mockSettings = {
    get: jest.fn((key: string) => {
      if (key === "apiKey") return "global-api-key";
      if (key === "endpoint") return "https://global.example.com";
      if (key === "retries") return 3;
      if (key === "retryMinTimeout") return 1000;
      if (key === "retryMaxTimeout") return 10000;
      return undefined;
    }),
    getApiUrl: jest.fn(() => "https://global.example.com/api/v1"),
    getRetryConfig: jest.fn(() => ({
      retries: 3,
      retryMinTimeout: 1000,
      retryMaxTimeout: 10000,
    })),
  };
  return {
    getConfig: jest.fn(() => mockSettings),
  };
});

const buildEmptyResponse = (): SearchResponse<unknown, IMessage> => ({
  results: [],
  request: {
    orderBy: "relevance",
    order: "desc",
    candidateOrderBy: "relevance",
  },
});

describe("search api", () => {
  const apiRequestMock = apiRequest as jest.Mock;
  const getConfigMock = getConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeSettings = (
    apiKey = "my-api-key",
    endpoint = "https://api.example.com"
  ) => {
    const s = new SettingsContainer();
    s.set("apiKey", apiKey);
    s.set("endpoint", endpoint);
    return s;
  };

  describe("request", () => {
    it("posts to /search with body and Bearer auth", async () => {
      const settings = makeSettings(
        "test-api-key-123",
        "https://api.example.com"
      );
      const input: SearchInput = { query: "billing", object: "dialogue" };

      apiRequestMock.mockResolvedValueOnce(buildEmptyResponse());

      await search(input, settings);

      expect(apiRequestMock).toHaveBeenCalledTimes(1);
      const [url, opts, retry] = apiRequestMock.mock.calls[0];
      expect(url).toBe("https://api.example.com/api/v1/search");
      expect(opts.method).toBe("POST");
      expect(opts.headers.get("Authorization")).toBe("Bearer test-api-key-123");
      expect(opts.body).toBe(JSON.stringify(input));
      expect(retry).toEqual({
        retries: 3,
        retryMinTimeout: 1000,
        retryMaxTimeout: 10000,
      });
    });

    it("passes the new option fields through to the body", async () => {
      const settings = makeSettings();
      const input: SearchInput = {
        query: "q",
        object: "message",
        limit: 5,
        namespace: "ns",
        timezone: "America/Chicago",
        tags: { $all: ["urgent", "billing"] },
        filter: {
          created: { gte: "2025-03-01T00:00:00Z", lt: "2025-04-01T00:00:00Z" },
        },
        metadata: { tier: { $in: ["pro", "enterprise"] } },
        orderBy: "created",
        order: "asc",
      };

      apiRequestMock.mockResolvedValueOnce(buildEmptyResponse());

      await search(input, settings);

      const [, opts] = apiRequestMock.mock.calls[0];
      expect(JSON.parse(opts.body)).toEqual(input);
    });

    it("falls back to global config when settings omitted", async () => {
      apiRequestMock.mockResolvedValueOnce(buildEmptyResponse());

      await search({ query: "q", object: "memory" });

      expect(getConfigMock).toHaveBeenCalled();
      const [url] = apiRequestMock.mock.calls[0];
      expect(url).toBe("https://global.example.com/api/v1/search");
    });
  });

  describe("response shape", () => {
    it("returns the wrapper response unmodified", async () => {
      const settings = makeSettings();
      const wireResponse: SearchResponse<unknown, IMessage> = {
        results: [
          {
            object: "dialogue",
            relevance: 0.87,
            item: { id: "d1" },
            matches: [
              {
                object: "message",
                relevance: 0.91,
                item: { id: "m1", dialogueId: "d1" } as IMessage,
              },
            ],
          },
        ],
        request: {
          orderBy: "relevance",
          order: "desc",
          candidateOrderBy: "relevance",
          filter: {
            created: {
              gte: "2025-03-01T00:00:00Z",
              lt: "2025-04-01T00:00:00Z",
            },
          },
        },
      };

      apiRequestMock.mockResolvedValueOnce(wireResponse);

      const result = await search({ query: "q", object: "dialogue" }, settings);

      expect(result).toBe(wireResponse);
      expect(result.results[0].relevance).toBe(0.87);
      expect(result.results[0].matches?.[0].item.dialogueId).toBe("d1");
      expect(result.request.filter?.created).toEqual({
        gte: "2025-03-01T00:00:00Z",
        lt: "2025-04-01T00:00:00Z",
      });
    });
  });

  describe("client-side validation (SDK boundary)", () => {
    it("rejects deprecated filter.createdYear with a migration hint", async () => {
      const settings = makeSettings();
      apiRequestMock.mockResolvedValueOnce(buildEmptyResponse());

      await expect(
        search(
          {
            query: "q",
            object: "dialogue",
            filter: { createdYear: 2025 } as any,
          },
          settings
        )
      ).rejects.toMatchObject({
        code: "INVALID_PARAMETER",
        message: expect.stringContaining("filter.created"),
      });

      expect(apiRequestMock).not.toHaveBeenCalled();
    });

    it("rejects deprecated filter.modifiedTimestamp with a migration hint", async () => {
      const settings = makeSettings();

      await expect(
        search(
          {
            query: "q",
            object: "dialogue",
            filter: { modifiedTimestamp: 1700000000 } as any,
          },
          settings
        )
      ).rejects.toMatchObject({
        code: "INVALID_PARAMETER",
        message: expect.stringContaining("filter.modified"),
      });
    });

    it("rejects an unknown tag operator", async () => {
      const settings = makeSettings();

      await expect(
        search(
          {
            query: "q",
            object: "dialogue",
            tags: { $weird: ["x"] } as any,
          },
          settings
        )
      ).rejects.toMatchObject({ code: "INVALID_PARAMETER" });
    });

    it("rejects an empty $in metadata operator", async () => {
      const settings = makeSettings();

      await expect(
        search(
          {
            query: "q",
            object: "dialogue",
            metadata: { tier: { $in: [] } },
          },
          settings
        )
      ).rejects.toMatchObject({ code: "INVALID_PARAMETER" });
    });

    it("rejects mixed-type array in metadata $in", async () => {
      const settings = makeSettings();

      await expect(
        search(
          {
            query: "q",
            object: "dialogue",
            metadata: { tier: { $in: ["pro", 1 as any] } } as any,
          },
          settings
        )
      ).rejects.toMatchObject({ code: "INVALID_PARAMETER" });
    });

    it("rejects unknown filter key", async () => {
      const settings = makeSettings();

      await expect(
        search(
          {
            query: "q",
            object: "dialogue",
            filter: { whenever: "today" } as any,
          },
          settings
        )
      ).rejects.toMatchObject({ code: "INVALID_PARAMETER" });
    });

    it("rejects missing query", async () => {
      const settings = makeSettings();

      await expect(
        search({ object: "dialogue" } as any, settings)
      ).rejects.toMatchObject({ code: "INVALID_PARAMETER" });
    });

    it("rejects invalid object value", async () => {
      const settings = makeSettings();

      await expect(
        search({ query: "q", object: "other" as any }, settings)
      ).rejects.toMatchObject({ code: "INVALID_PARAMETER" });
    });

    it("rejects orderBy outside the allowed set", async () => {
      const settings = makeSettings();

      await expect(
        search(
          { query: "q", object: "dialogue", orderBy: "stars" as any },
          settings
        )
      ).rejects.toMatchObject({ code: "INVALID_PARAMETER" });
    });
  });
});
