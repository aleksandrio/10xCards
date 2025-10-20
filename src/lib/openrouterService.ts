import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Custom error classes for OpenRouter service
 */

/**
 * Thrown for 401 Unauthorized errors if the API key is invalid.
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Thrown for 429 Too Many Requests.
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Thrown for 400 Bad Request errors, indicating a problem with the request payload.
 */
export class BadRequestError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "BadRequestError";
  }
}

/**
 * A generic error for other API-related issues (e.g., 5xx server errors).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thrown if the API response does not match the provided Zod schema.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public validationErrors?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Thrown for fetch exceptions (e.g., timeouts, DNS issues).
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Configuration Error for missing environment variables
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Parameters for chat completion requests
 */
export interface ChatCompletionParams<T = unknown> {
  /** The name of the model to use (e.g., 'openai/gpt-4o') */
  model: string;
  /** An optional system message to guide the model's behavior */
  systemMessage?: string;
  /** The user's prompt */
  userMessage: string;
  /** An optional Zod schema to define the expected JSON structure of the response */
  responseSchema?: z.ZodSchema<T>;
  /** The sampling temperature (e.g., 0.7) */
  temperature?: number;
  /** The maximum number of tokens to generate */
  max_tokens?: number;
}

/**
 * OpenRouter API response structure
 */
interface OpenRouterApiResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouterService - A service for interacting with the OpenRouter.ai API
 *
 * This service provides a robust interface for making chat completion requests
 * with support for structured outputs using Zod schemas.
 *
 * @example
 * ```typescript
 * const service = new OpenRouterService();
 * const response = await service.getChatCompletion({
 *   model: 'openai/gpt-4o',
 *   systemMessage: 'You are a helpful assistant.',
 *   userMessage: 'What is 2+2?',
 *   temperature: 0.7
 * });
 * ```
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly apiUrl = "https://openrouter.ai/api/v1/chat/completions";

  /**
   * Initializes the OpenRouter service
   *
   * @throws {ConfigurationError} If required environment variables are missing
   */
  constructor() {
    // Guard clause: Check for required environment variables
    if (!import.meta.env.PUBLIC_OPENROUTER_API_KEY) {
      throw new ConfigurationError("PUBLIC_OPENROUTER_API_KEY environment variable is not set.");
    }

    if (!import.meta.env.PUBLIC_SITE_URL) {
      throw new ConfigurationError("PUBLIC_SITE_URL environment variable is not set for HTTP-Referer header.");
    }

    this.apiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY;
    this.siteUrl = import.meta.env.PUBLIC_SITE_URL;
  }

  /**
   * Makes a chat completion request to the OpenRouter API
   *
   * @template T - The expected type of the response
   * @param params - The chat completion parameters
   * @returns A promise that resolves to the parsed response
   * @throws {AuthenticationError} If the API key is invalid
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {BadRequestError} If the request is malformed
   * @throws {ValidationError} If the response doesn't match the schema
   * @throws {NetworkError} If there's a network failure
   * @throws {ApiError} For other API-related errors
   *
   * @example
   * ```typescript
   * const schema = z.object({ answer: z.string() });
   * const result = await service.getChatCompletion({
   *   model: 'openai/gpt-4o',
   *   userMessage: 'What is 2+2?',
   *   responseSchema: schema
   * });
   * console.log(result.answer); // Type-safe access
   * ```
   */
  public async getChatCompletion<T>(params: ChatCompletionParams<T>): Promise<T> {
    try {
      // Build the request body
      const requestBody = this.buildRequestBody(params);

      // Execute the API request
      const response = await this.executeRequest(requestBody);

      // Parse and validate the response
      const result = this.parseResponse<T>(response, params.responseSchema);

      return result;
    } catch (error) {
      // Re-throw custom errors as-is
      if (
        error instanceof AuthenticationError ||
        error instanceof RateLimitError ||
        error instanceof BadRequestError ||
        error instanceof ValidationError ||
        error instanceof NetworkError ||
        error instanceof ApiError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      // eslint-disable-next-line no-console
      console.error("Unexpected error in getChatCompletion:", error);
      throw new ApiError("An unexpected error occurred during the chat completion request", undefined, error);
    }
  }

  /**
   * Builds the request body for the OpenRouter API
   *
   * @private
   * @param params - The chat completion parameters
   * @returns The formatted request body
   */
  private buildRequestBody<T>(params: ChatCompletionParams<T>): Record<string, unknown> {
    // Build messages array
    const messages: { role: string; content: string }[] = [];

    // Add system message if provided
    if (params.systemMessage) {
      messages.push({
        role: "system",
        content: params.systemMessage,
      });
    }

    // Add user message (always required)
    messages.push({
      role: "user",
      content: params.userMessage,
    });

    // Build base request body
    const requestBody: Record<string, unknown> = {
      model: params.model,
      messages,
    };

    // Add optional parameters if provided
    if (params.temperature !== undefined) {
      requestBody.temperature = params.temperature;
    }

    if (params.max_tokens !== undefined) {
      requestBody.max_tokens = params.max_tokens;
    }

    // Add response format if schema is provided
    if (params.responseSchema) {
      const jsonSchema = zodToJsonSchema(params.responseSchema);

      requestBody.response_format = {
        type: "json_schema",
        json_schema: {
          name: "extracted_data",
          strict: true,
          schema: jsonSchema,
        },
      };
    }

    return requestBody;
  }

  /**
   * Executes the HTTP request to the OpenRouter API
   *
   * @private
   * @param requestBody - The request payload
   * @returns The API response
   * @throws {NetworkError} If the request fails
   * @throws {AuthenticationError} For 401 errors
   * @throws {RateLimitError} For 429 errors
   * @throws {BadRequestError} For 400 errors
   * @throws {ApiError} For other HTTP errors
   */
  private async executeRequest(requestBody: Record<string, unknown>): Promise<OpenRouterApiResponse> {
    let response: Response;

    try {
      // Make the HTTP request
      response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.siteUrl,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      // Handle network-level errors (DNS, timeout, etc.)
      // eslint-disable-next-line no-console
      console.error("Network error during OpenRouter API request:", error);
      throw new NetworkError("Failed to connect to OpenRouter API. Please check your network connection.", error);
    }

    // Handle non-2xx responses
    if (!response.ok) {
      let errorDetails: unknown;
      let errorMessage = "OpenRouter API request failed";

      try {
        errorDetails = await response.json();
        // Try to extract a more specific error message if available
        if (errorDetails && typeof errorDetails === "object" && "error" in errorDetails) {
          const errorObj = errorDetails.error;
          if (typeof errorObj === "object" && errorObj !== null && "message" in errorObj) {
            errorMessage = String(errorObj.message);
          }
        }
      } catch {
        // If parsing JSON fails, use the status text
        errorMessage = response.statusText || errorMessage;
      }

      // Throw specific error based on status code
      switch (response.status) {
        case 400:
          throw new BadRequestError(
            `Bad Request: ${errorMessage}. Please check your request parameters.`,
            errorDetails
          );

        case 401:
          throw new AuthenticationError(`Authentication failed: ${errorMessage}. Please check your API key.`);

        case 429:
          throw new RateLimitError(`Rate limit exceeded: ${errorMessage}. Please try again later.`);

        default:
          throw new ApiError(`API Error (${response.status}): ${errorMessage}`, response.status, errorDetails);
      }
    }

    // Parse successful response
    try {
      const data = await response.json();
      return data as OpenRouterApiResponse;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse OpenRouter API response:", error);
      throw new ApiError("Received invalid JSON response from OpenRouter API", response.status, error);
    }
  }

  /**
   * Parses and validates the API response
   *
   * @private
   * @template T - The expected type of the response
   * @param response - The API response
   * @param schema - Optional Zod schema for validation
   * @returns The parsed and validated response
   * @throws {ValidationError} If validation fails
   */
  private parseResponse<T>(response: OpenRouterApiResponse, schema?: z.ZodSchema<T>): T {
    // Guard clause: Check if response has choices
    if (!response.choices || response.choices.length === 0) {
      throw new ApiError("API response is missing choices array");
    }

    // Extract content from the first choice
    const content = response.choices[0].message.content;

    // Guard clause: Check if content exists
    if (!content) {
      throw new ApiError("API response message content is empty");
    }

    // If no schema is provided, return the content as-is (cast to T for string responses)
    if (!schema) {
      return content as T;
    }

    // Parse and validate JSON response
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(content);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse JSON from API response:", error);
      throw new ValidationError("API returned invalid JSON. Expected valid JSON response.", {
        parseError: error instanceof Error ? error.message : "Unknown parse error",
        content,
      });
    }

    // Validate against the provided schema
    const validationResult = schema.safeParse(parsedJson);

    if (!validationResult.success) {
      // eslint-disable-next-line no-console
      console.error("Schema validation failed:", validationResult.error.errors);
      throw new ValidationError("API response does not match the expected schema", validationResult.error.errors);
    }

    return validationResult.data;
  }
}
