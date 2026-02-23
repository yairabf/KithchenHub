import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '../i18n';

export interface HouseholdMember {
  id: string;
  name: string;
  isDefault: boolean;
  color?: string;
}

interface HouseholdContextType {
  members: HouseholdMember[];
  isLoading: boolean;
  addMember: (name: string, color?: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  getMemberById: (id: string) => HouseholdMember | undefined;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const STORAGE_KEY = '@kitchen_hub_household_members';

const DEFAULT_MEMBER_TEMPLATES = [
  { id: 'default-mom', nameKey: 'mom', fallback: 'Mom', color: '#FFB5A7' },
  { id: 'default-dad', nameKey: 'dad', fallback: 'Dad', color: '#B8E6E1' },
  { id: 'default-kids', nameKey: 'kids', fallback: 'Kids', color: '#FFD4A3' },
  { id: 'default-all', nameKey: 'all', fallback: 'All', color: '#D4C5F9' },
];

function getDefaultMembers(): HouseholdMember[] {
  return DEFAULT_MEMBER_TEMPLATES.map(member => ({
    id: member.id,
    name: i18n.t(`settings:householdMembers.${member.nameKey}`, { defaultValue: member.fallback }),
    isDefault: true,
    color: member.color,
  }));
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<HouseholdMember[]>(() => getDefaultMembers());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    const handleLanguageChange = () => {
      setMembers(prevMembers => {
        const customMembers = prevMembers.filter(member => !member.isDefault);
        return [...getDefaultMembers(), ...customMembers];
      });
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const loadMembers = async () => {
    try {
      const defaultMembers = getDefaultMembers();
      const storedMembers = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedMembers) {
        const customMembers: HouseholdMember[] = JSON.parse(storedMembers);
        // Combine default members with custom members
        setMembers([...defaultMembers, ...customMembers]);
      } else {
        setMembers(defaultMembers);
      }
    } catch (error) {
      console.error('Error loading household members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomMembers = async (customMembers: HouseholdMember[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customMembers));
    } catch (error) {
      console.error('Error saving household members:', error);
    }
  };

  const addMember = async (name: string, color?: string) => {
    const newMember: HouseholdMember = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      isDefault: false,
      color: color || '#C5E8B7',
    };

    const updatedMembers = [...members, newMember];
    setMembers(updatedMembers);

    // Save only custom members
    const customMembers = updatedMembers.filter(m => !m.isDefault);
    await saveCustomMembers(customMembers);
  };

  const removeMember = async (id: string) => {
    // Prevent removing default members
    const memberToRemove = members.find(m => m.id === id);
    if (memberToRemove?.isDefault) {
      console.warn('Cannot remove default household members');
      return;
    }

    const updatedMembers = members.filter(m => m.id !== id);
    setMembers(updatedMembers);

    // Save only custom members
    const customMembers = updatedMembers.filter(m => !m.isDefault);
    await saveCustomMembers(customMembers);
  };

  const getMemberById = (id: string) => {
    return members.find(m => m.id === id);
  };

  return (
    <HouseholdContext.Provider
      value={{
        members,
        isLoading,
        addMember,
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
