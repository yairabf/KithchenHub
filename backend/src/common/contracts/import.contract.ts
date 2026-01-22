import { z } from 'zod';

// Shared validation rules
const LocalIdSchema = z.string().min(1);
const TimestampSchema = z.string().datetime().or(z.date()).optional();

// --- Entity Schemas ---

export const ShoppingItemSchema = z.object({
    localId: LocalIdSchema,
    name: z.string().min(1),
    quantity: z.number().default(1),
    unit: z.string().optional().nullable(),
    isChecked: z.boolean().default(false),
    category: z.string().optional().nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
});

export const ShoppingListSchema = z.object({
    localId: LocalIdSchema,
    name: z.string().min(1),
    color: z.string().optional().nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    items: z.array(ShoppingItemSchema).default([]),
});

export const RecipeSchema = z.object({
    localId: LocalIdSchema,
    title: z.string().min(1),
    prepTime: z.number().int().min(0).optional().nullable(),
    ingredients: z.array(z.any()).default([]), // specific structure can be refined if needed
    instructions: z.array(z.any()).default([]),
    imageUrl: z.string().url().optional().nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
});

export const ChoreSchema = z.object({
    localId: LocalIdSchema,
    title: z.string().min(1),
    assigneeId: z.string().optional().nullable(), // Local or server ID? For import, likely null or local
    dueDate: TimestampSchema,
    isCompleted: z.boolean().default(false),
    completedAt: TimestampSchema,
    repeat: z.string().optional().nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
});

// --- Payload Schema ---

export const ImportRequestSchema = z.object({
    shoppingLists: z.array(ShoppingListSchema).default([]),
    recipes: z.array(RecipeSchema).default([]),
    chores: z.array(ChoreSchema).default([]),
});

// --- Response Schema ---

export const EntityMappingSchema = z.object({
    localId: z.string(),
    serverId: z.string(),
});

export const ImportResponseSchema = z.object({
    shoppingLists: z.array(EntityMappingSchema),
    recipes: z.array(EntityMappingSchema),
    chores: z.array(EntityMappingSchema),
});

// --- Types ---

export type ImportRequest = z.infer<typeof ImportRequestSchema>;
export type ImportResponse = z.infer<typeof ImportResponseSchema>;
export type ShoppingListImport = z.infer<typeof ShoppingListSchema>;
export type ShoppingItemImport = z.infer<typeof ShoppingItemSchema>;
export type RecipeImport = z.infer<typeof RecipeSchema>;
export type ChoreImport = z.infer<typeof ChoreSchema>;
