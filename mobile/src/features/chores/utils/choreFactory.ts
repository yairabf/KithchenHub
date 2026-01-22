import * as Crypto from 'expo-crypto';
import type { Chore } from '../../../mocks/chores';

interface NewChoreData {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
}

export const createChore = (data: NewChoreData): Chore => {
    return {
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
};
