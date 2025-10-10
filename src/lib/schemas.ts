import { z } from "zod";

/**
 * Zod schema for validating deck creation requests.
 * Ensures the name field is present, trimmed, and within length constraints.
 */
export const createDeckSchema = z.object({
  name: z.string().trim().min(1, "Deck name cannot be empty").max(100, "Deck name cannot exceed 100 characters"),
});

/**
 * Zod schema for validating deck update requests.
 * Ensures the name field is present, trimmed, and within length constraints.
 */
export const updateDeckSchema = z.object({
  name: z.string().trim().min(1, "Deck name cannot be empty").max(100, "Deck name cannot exceed 100 characters"),
});

/**
 * Zod schema for validating pagination query parameters.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.enum(["name", "created_at", "updated_at"]).optional().default("updated_at"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Zod schema for validating flashcard pagination query parameters.
 * Simpler than deck pagination - only page and pageSize.
 */
export const flashcardPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/**
 * Zod schema for validating UUID path parameters.
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Zod schema for validating flashcard creation requests.
 * Ensures front and back fields are present, trimmed, and within length constraints.
 */
export const createFlashcardSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Front of flashcard cannot be empty")
    .max(200, "Front of flashcard cannot exceed 200 characters"),
  back: z
    .string()
    .trim()
    .min(1, "Back of flashcard cannot be empty")
    .max(500, "Back of flashcard cannot exceed 500 characters"),
});

/**
 * Zod schema for validating flashcard update requests.
 * Both fields are optional, but at least one must be provided.
 */
export const updateFlashcardSchema = z
  .object({
    front: z
      .string()
      .trim()
      .min(1, "Front of flashcard cannot be empty")
      .max(200, "Front of flashcard cannot exceed 200 characters")
      .optional(),
    back: z
      .string()
      .trim()
      .min(1, "Back of flashcard cannot be empty")
      .max(500, "Back of flashcard cannot exceed 500 characters")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

/**
 * Zod schema for validating bulk flashcard creation requests.
 */
export const bulkCreateFlashcardsSchema = z.object({
  generationId: z.string().uuid("Invalid generation ID format"),
  flashcards: z
    .array(
      z.object({
        front: z
          .string()
          .trim()
          .min(1, "Front of flashcard cannot be empty")
          .max(200, "Front of flashcard cannot exceed 200 characters"),
        back: z
          .string()
          .trim()
          .min(1, "Back of flashcard cannot be empty")
          .max(500, "Back of flashcard cannot exceed 500 characters"),
      })
    )
    .min(1, "At least one flashcard must be provided")
    .max(100, "Cannot create more than 100 flashcards at once"),
});
