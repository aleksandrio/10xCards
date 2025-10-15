# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterService` will be a dedicated service responsible for all interactions with the OpenRouter.ai API. It will provide a simple, robust interface for making chat completion requests, handling configuration, formatting requests, parsing responses, and managing errors. The service will be designed to be used in Astro server-side code (API routes, server-rendered pages) to protect API keys and manage interactions with the LLM provider securely.

## 2. Constructor Description

The service will be implemented as a TypeScript class. The constructor will initialize the service by setting up the necessary configuration.

-   **`constructor()`**:
    -   Initializes an HTTP client (using native `fetch`).
    -   Loads the OpenRouter API Key from environment variables (`import.meta.env.OPENROUTER_API_KEY`).
    -   Loads the application URL for the `HTTP-Referer` header from environment variables (`import.meta.env.ASTRO_URL`).
    -   Throws a runtime error if essential environment variables are missing to ensure fail-fast behavior during application startup.

```typescript
// Example Implementation
import { AppError } from '@/lib/errors'; // Assuming custom errors are defined

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly siteUrl: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    if (!import.meta.env.OPENROUTER_API_KEY) {
      throw new AppError('Configuration Error', 'OPENROUTER_API_KEY environment variable is not set.');
    }
    if (!import.meta.env.SITE_URL) {
        throw new AppError('Configuration Error', 'SITE_URL environment variable is not set for HTTP-Referer header.');
    }
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;
    this.siteUrl = import.meta.env.SITE_URL;
  }

  // ... methods
}
```

## 3. Public Methods and Fields

The service will expose a primary public method to handle chat completions.

-   **`public async getChatCompletion<T>(params: ChatCompletionParams): Promise<T>`**:
    -   This is the main method for interacting with the API. It is a generic method to allow for type-safe structured responses.
    -   **Parameters (`ChatCompletionParams`)**:
        -   `model`: `string` - The name of the model to use (e.g., `openai/gpt-4o`).
        -   `systemMessage?`: `string` - An optional system message to guide the model's behavior.
        -   `userMessage`: `string` - The user's prompt.
        -   `responseSchema?`: `z.ZodSchema<T>` - An optional Zod schema to define the expected JSON structure of the response. If provided, `zod-to-json-schema` will be used to generate the `response_format` object.
        -   `temperature?`: `number` - The sampling temperature (e.g., `0.7`).
        -   `max_tokens?`: `number` - The maximum number of tokens to generate.
    -   **Returns**: `Promise<T>` - A promise that resolves to the parsed response. If `responseSchema` is provided, the response will be validated and typed as `T`. Otherwise, it will be a `string`.

## 4. Private Methods and Fields

Internal methods will encapsulate the logic for building requests, making API calls, and parsing responses.

-   **`private buildRequestBody(params: ChatCompletionParams): Record<string, any>`**:
    -   Constructs the JSON payload for the OpenRouter API.
    -   Builds the `messages` array from `systemMessage` and `userMessage`.
    -   If `responseSchema` is provided, it uses `zod-to-json-schema` to convert the Zod schema into a JSON schema and formats the `response_format` object.
    -   Includes other model parameters like `temperature` and `max_tokens`.
-   **`private async executeRequest<T>(requestBody: Record<string, any>): Promise<ApiResponse>`**:
    -   Makes the `fetch` call to the OpenRouter API.
    -   Sets the required headers: `Authorization`, `Content-Type`, and `HTTP-Referer`.
    -   Handles the HTTP response, checking for non-2xx status codes and throwing appropriate errors.
-   **`private parseResponse<T>(response: ApiResponse, schema?: z.ZodSchema<T>): T`**:
    -   Extracts the content from `response.choices[0].message.content`.
    -   If a `schema` is provided, it parses the JSON string and validates it against the schema. If validation fails, it throws a `ValidationError`.
    -   If no schema is provided, it returns the content as a string.

## 5. Error Handling

The service will implement robust error handling by defining and throwing custom error classes for different failure scenarios. This allows the calling code to handle specific errors gracefully.

-   **`AuthenticationError`**: Thrown for 401 Unauthorized errors if the API key is invalid.
-   **`RateLimitError`**: Thrown for 429 Too Many Requests. The caller can decide to implement retry logic.
-   **`BadRequestError`**: Thrown for 400 Bad Request errors, indicating a problem with the request payload. Should include details from the API response.
-   **`ApiError`**: A generic error for other API-related issues (e.g., 5xx server errors).
-   **`ValidationError`**: Thrown if the API response does not match the provided Zod schema.
-   **`NetworkError`**: Thrown for `fetch` exceptions (e.g., timeouts, DNS issues).

All errors should be logged on the server with sufficient context for debugging.

## 6. Security Considerations

-   **API Key Management**: The OpenRouter API key is a secret and must be stored securely in environment variables. It should never be exposed to the client-side. All API calls must originate from the server.
-   **Input Sanitization**: While the service itself doesn't directly face users, the inputs (`userMessage`) it receives should be sanitized by the calling API route to prevent prompt injection attacks if user-provided content is mixed with system instructions.
-   **Denial of Service (DoS)**: API routes using this service should be protected against abuse. Implement rate limiting on a per-user or per-IP basis on the endpoints that call this service.

## 7. Step-by-Step Implementation Plan

1.  **Environment Variables**: Add the following variables to your `.env` file and configure them for your deployment environment.
    ```env
    # .env
    OPENROUTER_API_KEY="your-openrouter-api-key"
    SITE_URL="http://localhost:4321" # Update for production
    ```

2.  **Create Service File**: Create the service file at `src/lib/openrouterService.ts`.

3.  **Implement the `OpenRouterService` Class**:
    -   Define the class and its private fields (`apiKey`, `siteUrl`, `apiUrl`).
    -   Implement the constructor as described in section 2, including checks for environment variables.

4.  **Implement the `getChatCompletion` Method**:
    -   Define the public method signature with generics and the `ChatCompletionParams` interface.
    -   Call the private `buildRequestBody` method to construct the payload.
    -   Call the private `executeRequest` method with the payload.
    -   Call the private `parseResponse` method with the API response and the optional schema.
    -   Wrap the entire logic in a `try...catch` block to handle and re-throw custom errors.

5.  **Implement `buildRequestBody`**:
    -   Create the `messages` array. Start with the system message if it exists, then add the user message.
    -   Check if `responseSchema` is provided. If so:
        -   Import `zodToJsonSchema` from `zod-to-json-schema`.
        -   Generate the JSON schema: `const jsonSchema = zodToJsonSchema(params.responseSchema);`
        -   Add the `response_format` object to the request body, following the structure:
            ```json
            {
              "type": "json_schema",
              "json_schema": {
                "name": "extracted_data",
                "strict": true,
                "schema": jsonSchema
              }
            }
            ```
    -   Add the model name and other parameters to the request body.

6.  **Implement `executeRequest`**:
    -   Use `fetch` to make a POST request.
    -   Set headers:
        -   `Authorization`: `Bearer ${this.apiKey}`
        -   `Content-Type`: `application/json`
        -   `HTTP-Referer`: `${this.siteUrl}`
    -   Set the `body` to the stringified request payload.
    -   After the request, check `response.ok`. If `false`, read the JSON error from the response body and throw a custom error based on `response.status`.

7.  **Implement `parseResponse`**:
    -   Get the content string: `response.choices[0].message.content`.
    -   If `schema` is not provided, return the content as is (after casting to `T`).
    -   If `schema` is provided:
        -   Wrap `JSON.parse(content)` in a `try...catch` block to handle malformed JSON.
        -   Use `schema.safeParse(parsedJson)` to validate the data.
        -   If `success` is `false`, throw a `ValidationError` with `error.errors` as context.
        -   If `success` is `true`, return `data`.

8.  **Usage Example (in an Astro API Route)**: There is an API route at `src/pages/api/generations.ts` to use the service.
    ```typescript
    // src/pages/api/generations.ts
    import type { APIRoute } from 'astro';
    import { z } from 'zod';
    import { OpenRouterService } from '@/lib/openrouterService'; // Adjust path

    // Define the expected output structure
    const flashcardSchema = z.object({
      front: z.string().describe('The question or term.'),
      back: z.string().describe('The answer or definition.'),
    });

    const flashcardsResponseSchema = z.object({
      flashcards: z.array(flashcardSchema),
    });

    export const POST: APIRoute = async ({ request }) => {
      try {
        const body = await request.json();
        const { topic } = body; // Assume topic is sent from the client

        if (!topic) {
          return new Response(JSON.stringify({ error: 'Topic is required' }), { status: 400 });
        }

        const openRouterService = new OpenRouterService();
        const responseData = await openRouterService.getChatCompletion({
          model: 'openai/gpt-4o',
          systemMessage: 'You are an expert flashcard creator. Generate exactly 5 flashcards based on the user\'s topic.',
          userMessage: `The topic is: ${topic}`,
          responseSchema: flashcardsResponseSchema,
          temperature: 0.5,
        });

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error(error); // Implement proper logging
        // Handle custom errors from the service
        // For example, if (error instanceof ValidationError) { ... }
        return new Response(JSON.stringify({ error: 'Failed to generate flashcards.' }), { status: 500 });
      }
    };
    ```
