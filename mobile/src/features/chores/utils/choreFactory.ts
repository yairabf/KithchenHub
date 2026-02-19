import * as Crypto from 'expo-crypto';
import type { Chore } from '../../../mocks/chores';

export interface NewChoreData {
    title: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek' | 'recurring';
    isRecurring?: boolean;
    /** Granular recurrence schedule; only meaningful when isRecurring is true. */
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | null;
}

/**
 * Creates a new Chore entity from user-supplied input data.
 *
 * Both `id` and `localId` use crypto UUIDs to eliminate millisecond-precision
 * collisions that can occur with Date.now()-based IDs when multiple chores
 * are created in rapid succession.
 *
 * Timestamps are set at creation time so callers receive a fully-formed entity.
 *
 * @param data - Validated input data from the chore creation form
 * @returns A fully-formed Chore ready for local storage or server sync
 */
export const createChore = (data: NewChoreData): Chore => {
    const now = new Date();
    return {
        id: Crypto.randomUUID(),
        localId: Crypto.randomUUID(),
        title: data.title,
        assignee: data.assignee,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        isCompleted: false,
        section: data.section,
        icon: data.icon,
        isRecurring: data.isRecurring ?? false,
        recurrencePattern: data.recurrencePattern ?? null,
        createdAt: now,
        updatedAt: now,
    };
};
