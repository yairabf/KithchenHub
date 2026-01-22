import { createChore } from '../choreFactory';
import * as Crypto from 'expo-crypto';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'test-uuid-chore'),
}));

describe('choreFactory', () => {
    describe('createChore', () => {
        it('should create a chore with a valid localId', () => {
            const choreData = {
                name: 'Clean Room',
                icon: '🧹',
                assignee: 'Alice',
                dueDate: 'Today',
                dueTime: '10:00 AM',
                section: 'today' as const,
            };

            const chore = createChore(choreData);

            expect(chore.localId).toBe('test-uuid-chore');
            expect(chore.name).toBe(choreData.name);
            expect(chore.assignee).toBe(choreData.assignee);
            expect(chore.section).toBe(choreData.section);
            expect(chore.completed).toBe(false);
            expect(chore.id).toBeDefined();
        });
    });
});
