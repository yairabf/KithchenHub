import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { householdService } from '../services/householdService';

export interface HouseholdMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatarUrl?: string;
  color?: string;
  isCurrentUser: boolean;
}

interface HouseholdContextType {
  members: HouseholdMember[];
  isLoading: boolean;
  removeMember: (id: string) => Promise<void>;
  getMemberById: (id: string) => HouseholdMember | undefined;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

const MEMBER_COLORS = ['#FFB5A7', '#B8E6E1', '#FFD4A3', '#D4C5F9', '#C5E8B7'];

function getMemberDisplayName(name: string | undefined, email: string | undefined): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    return trimmedEmail;
  }

  return 'KitchenHub User';
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    if (!user?.id || !user.householdId) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const household = await householdService.getHousehold();
      setMembers(
        household.members.map((member, index) => ({
          id: member.id,
          name: getMemberDisplayName(member.name, member.email),
          email: member.email?.trim() || undefined,
          role: member.role,
          avatarUrl: member.avatarUrl,
          color: MEMBER_COLORS[index % MEMBER_COLORS.length],
          isCurrentUser: member.id === user.id,
        })),
      );
    } catch (error) {
      console.error('Error loading household members:', error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.householdId, user?.id]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const removeMember = useCallback(async (id: string) => {
    const memberToRemove = members.find((member) => member.id === id);
    if (!memberToRemove || memberToRemove.isCurrentUser) {
      return;
    }

    await householdService.removeMember(id);
    await loadMembers();
  }, [loadMembers, members]);

  const getMemberById = useCallback((id: string) => {
    return members.find((member) => member.id === id);
  }, [members]);

  return (
    <HouseholdContext.Provider
      value={{
        members,
        isLoading,
        removeMember,
        getMemberById,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}
