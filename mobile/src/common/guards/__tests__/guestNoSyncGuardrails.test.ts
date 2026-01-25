import {
  assertSignedInMode,
  assertNoGuestMode,
} from '../guestNoSyncGuardrails';
import type { User } from '../../../contexts/AuthContext';

describe('guestNoSyncGuardrails', () => {
  const signedInUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    isGuest: false,
  };
  
  const guestUser: User = {
    id: 'guest-1',
    email: '',
    name: 'Guest',
    isGuest: true,
  };
  
  describe('assertSignedInMode', () => {
    it('should not throw for signed-in user', () => {
      expect(() => assertSignedInMode(signedInUser, 'Test operation')).not.toThrow();
    });
    
    it('should throw for guest user', () => {
      expect(() => assertSignedInMode(guestUser, 'Test operation')).toThrow(
        'is not allowed in guest mode'
      );
    });
    
    it('should throw for null user', () => {
      expect(() => assertSignedInMode(null, 'Test operation')).toThrow(
        'is not allowed in guest mode'
      );
    });
    
    it('should include operation name and user info in error message', () => {
      expect(() => assertSignedInMode(guestUser, 'Sync action enqueue')).toThrow(
        'Sync action enqueue is not allowed in guest mode (user: guest-1)'
      );
    });

    it('should include "no user" in error message when user is null', () => {
      expect(() => assertSignedInMode(null, 'Sync action enqueue')).toThrow(
        'Sync action enqueue is not allowed in guest mode (no user)'
      );
    });
    
    it('should narrow type to non-guest user', () => {
      const user: User | null = signedInUser;
      assertSignedInMode(user, 'Test');
      // TypeScript should now know user is not null and isGuest is false
      expect(user.isGuest).toBe(false);
    });
  });
  
  describe('assertNoGuestMode', () => {
    it('should not throw for signed-in user', () => {
      expect(() => assertNoGuestMode(signedInUser, 'Test operation')).not.toThrow();
    });
    
    it('should throw for guest user', () => {
      expect(() => assertNoGuestMode(guestUser, 'Test operation')).toThrow(
        'is not allowed in guest mode'
      );
    });
    
    it('should throw for null user', () => {
      expect(() => assertNoGuestMode(null, 'Test operation')).toThrow(
        'is not allowed in guest mode'
      );
    });
    
    it('should include operation name and user info in error message', () => {
      expect(() => assertNoGuestMode(guestUser, 'Remote API call')).toThrow(
        'Remote API call is not allowed in guest mode (user: guest-1)'
      );
    });

    it('should include "no user" in error message when user is null', () => {
      expect(() => assertNoGuestMode(null, 'Remote API call')).toThrow(
        'Remote API call is not allowed in guest mode (no user)'
      );
    });
  });
});
