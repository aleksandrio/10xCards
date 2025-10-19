import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from "vitest";
import { z } from "zod";
import type { OpenRouterService } from "@/lib/openrouterService";

const mockApiKey = "test-api-key";
const mockSiteUrl = "http://localhost:4321";

describe("OpenRouterService", () => {
  // Using vi.stubEnv is the recommended way to mock environment variables in Vitest.
  // It correctly handles `import.meta.env` and `process.env`.

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should throw ConfigurationError if OPENROUTER_API_KEY is not set", async () => {
      vi.stubEnv("OPENROUTER_API_KEY", "");
      vi.stubEnv("SITE_URL", mockSiteUrl);
      vi.resetModules();
      const { OpenRouterService } = await import("@/lib/openrouterService");
      expect(() => new OpenRouterService()).toThrow("OPENROUTER_API_KEY environment variable is not set.");
    });

    it("should throw ConfigurationError if SITE_URL is not set", async () => {
      vi.stubEnv("OPENROUTER_API_KEY", mockApiKey);
      vi.stubEnv("SITE_URL", "");
      vi.resetModules();
      const { OpenRouterService } = await import("@/lib/openrouterService");
      expect(() => new OpenRouterService()).toThrow(
        "SITE_URL environment variable is not set for HTTP-Referer header."
      );
    });

    it("should not throw an error if environment variables are set", async () => {
      vi.stubEnv("OPENROUTER_API_KEY", mockApiKey);
      vi.stubEnv("SITE_URL", mockSiteUrl);
      vi.resetModules();
      const { OpenRouterService } = await import("@/lib/openrouterService");
      expect(() => new OpenRouterService()).not.toThrow();
    });
  });

  describe("getChatCompletion", () => {
    let service: OpenRouterService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ErrorConstructor = new (...args: any[]) => Error;
    let ValidationError: ErrorConstructor;
    let AuthenticationError: ErrorConstructor;
    let RateLimitError: ErrorConstructor;
    let BadRequestError: ErrorConstructor;
    let ApiError: ErrorConstructor;
    let NetworkError: ErrorConstructor;

    beforeEach(async () => {
      vi.stubEnv("OPENROUTER_API_KEY", mockApiKey);
      vi.stubEnv("SITE_URL", mockSiteUrl);
      vi.resetModules();
      const module = await import("@/lib/openrouterService");
      service = new module.OpenRouterService();
      ValidationError = module.ValidationError;
      AuthenticationError = module.AuthenticationError;
      RateLimitError = module.RateLimitError;
      BadRequestError = module.BadRequestError;
      ApiError = module.ApiError;
      NetworkError = module.NetworkError;
      vi.spyOn(global, "fetch");
    });

    it("should return a string response when no schema is provided", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Hello, world!" } }],
      };
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getChatCompletion({
        model: "test-model",
        userMessage: "Say hello",
      });

      expect(result).toBe("Hello, world!");
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should return a validated object when a schema is provided", async () => {
      const responseSchema = z.object({
        greeting: z.string(),
        target: z.string(),
      });
      const mockContent = { greeting: "Hello", target: "world" };
      const mockResponse = {
        choices: [{ message: { content: JSON.stringify(mockContent) } }],
      };
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getChatCompletion({
        model: "test-model",
        userMessage: "Say hello",
        responseSchema,
      });

      expect(result).toEqual(mockContent);
    });

    it("should throw ValidationError if response is not valid JSON", async () => {
      const responseSchema = z.object({ message: z.string() });
      const mockResponse = {
        choices: [{ message: { content: "this is not json" } }],
      };
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        service.getChatCompletion({
          model: "test-model",
          userMessage: "...",
          responseSchema,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if response does not match schema", async () => {
      const responseSchema = z.object({
        expected: z.string(),
      });
      const mockContent = { unexpected: "data" };
      const mockResponse = {
        choices: [{ message: { content: JSON.stringify(mockContent) } }],
      };
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        service.getChatCompletion({
          model: "test-model",
          userMessage: "...",
          responseSchema,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw AuthenticationError on 401 response", async () => {
      (fetch as Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid API key" } }),
      });

      await expect(
        service.getChatCompletion({
          model: "test-model",
          userMessage: "...",
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it("should throw RateLimitError on 429 response", async () => {
      (fetch as Mock).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "Rate limit exceeded" } }),
      });

      await expect(
        service.getChatCompletion({
          model: "test-model",
          userMessage: "...",
        })
      ).rejects.toThrow(RateLimitError);
    });

    it("should throw BadRequestError on 400 response", async () => {
      (fetch as Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: "Bad request" } }),
      });

      await expect(
        service.getChatCompletion({
          model: "test-model",
          userMessage: "...",
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw ApiError on other non-2xx responses", async () => {
      (fetch as Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Internal server error" } }),
      });

      await expect(
        service.getChatCompletion({
          model: "test-model",
          userMessage: "...",
        })
      ).rejects.toThrow(ApiError);
    });

    it("should throw NetworkError on fetch failure", async () => {
      (fetch as Mock).mockRejectedValue(new Error("Network failure"));

      await expect(
        service.getChatCompletion({
          model: "test-model",
          userMessage: "...",
        })
      ).rejects.toThrow(NetworkError);
    });

    it("should correctly build the request body", async () => {
      const responseSchema = z.object({ message: z.string() });
      const mockResponse = {
        choices: [{ message: { content: JSON.stringify({ message: "ok" }) } }],
      };
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await service.getChatCompletion({
        model: "test-model/llama",
        userMessage: "User prompt",
        systemMessage: "System prompt",
        temperature: 0.8,
        max_tokens: 100,
        responseSchema,
      });

      expect(fetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": mockSiteUrl,
          },
          body: expect.stringContaining('"model":"test-model/llama"'),
        })
      );

      const requestBody = JSON.parse((fetch as Mock).mock.calls[0][1].body as string);
      expect(requestBody.messages).toEqual([
        { role: "system", content: "System prompt" },
        { role: "user", content: "User prompt" },
      ]);
      expect(requestBody.temperature).toBe(0.8);
      expect(requestBody.max_tokens).toBe(100);
      expect(requestBody.response_format.type).toBe("json_schema");
      expect(requestBody.response_format.json_schema.name).toBe("extracted_data");
    });
  });
});
