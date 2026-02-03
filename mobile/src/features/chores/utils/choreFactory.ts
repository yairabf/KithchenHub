import * as Crypto from 'expo-crypto';
import type { Chore } from '../../../mocks/chores';
import { withCreatedAtAndUpdatedAt } from '../../../common/utils/timestamps';

interface NewChoreData {
    title: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek' | 'recurring';
}

export const createChore = (data: NewChoreData): Chore => {
    const chore = {
        id: Date.now().toString(),
        localId: Crypto.randomUUID(),
        title: data.title,
        assignee: data.assignee,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        isCompleted: false,
        section: data.section,
        icon: data.icon,
    };
    // Business rule: auto-populate createdAt and updatedAt on creation
    return withCreatedAtAndUpdatedAt(chore);
};
