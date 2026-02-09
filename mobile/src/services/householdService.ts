import { api } from './api';

export interface HouseholdMember {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: string;
}

export interface Household {
    id: string;
    name: string;
    members: HouseholdMember[];
}

export const householdService = {
    /**
     * Creates a new household.
     */
    createHousehold: async (name: string): Promise<Household> => {
        return api.post<Household>('/household', { name });
    },

    /**
     * Joins an existing household via invite code.
     */
    joinHousehold: async (inviteCode: string): Promise<Household> => {
        return api.post<Household>('/household/join', { inviteCode });
    },

    /**
     * Generates an invite code for the household.
     */
    inviteMember: async (email?: string): Promise<{ inviteToken: string }> => {
        // Backend currently expects an email in the DTO, even if it doesn't use it for the code generation
        return api.post<{ inviteToken: string }>('/household/invite', { email: email || 'dummy@example.com' });
    },

    /**
     * Gets the current user's household.
     */
    getHousehold: async (): Promise<Household> => {
        return api.get<Household>('/household');
    },
};
