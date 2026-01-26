import * as Crypto from 'expo-crypto';
import type { Chore } from '../../../mocks/chores';
import { withCreatedAtAndUpdatedAt } from '../../../common/utils/timestamps';

interface NewChoreData {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
}

export const createChore = (data: NewChoreData): Chore => {
    const chore = {
        id: Date.now().toString(),
        localId: Crypto.randomUUID(),
        name: data.name,
        assignee: data.assignee,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        completed: false,
        section: data.section,
        icon: data.icon,
    };
    // Business rule: auto-populate createdAt and updatedAt on creation
    return withCreatedAtAndUpdatedAt(chore);
};
