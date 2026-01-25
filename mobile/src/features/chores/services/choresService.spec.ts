import {
  createChoresService,
  createChoresServiceLegacy,
  LocalChoresService,
  RemoteChoresService,
} from './choresService';
import { guestStorage } from '../../../common/utils/guestStorage';
import { api } from '../../../services/api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    default: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
    },
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock the api client
jest.mock('../../../services/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
    },
}));

// Mock guestStorage
jest.mock('../../../common/utils/guestStorage', () => ({
    guestStorage: {
        getChores: jest.fn().mockResolvedValue([]),
        saveChores: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('createChoresService', () => {
  describe.each([
    ['guest mode', 'guest', LocalChoresService],
    ['signed-in mode', 'signed-in', RemoteChoresService],
  ])('when %s', (_label, mode, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createChoresService(mode as 'guest' | 'signed-in');

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});

describe('createChoresServiceLegacy', () => {
  describe.each([
    ['mock enabled', true, LocalChoresService],
    ['mock disabled', false, RemoteChoresService],
  ])('when %s', (_label, isMockEnabled, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createChoresServiceLegacy(isMockEnabled);

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});

describe('LocalChoresService', () => {
  let service: LocalChoresService;

  beforeEach(() => {
    service = new LocalChoresService();
    jest.clearAllMocks();
  });

  describe('Storage persistence (smoke test)', () => {
    it('should persist chore to guestStorage', async () => {
      (guestStorage.getChores as jest.Mock).mockResolvedValue([]);
      
      const chore = await service.createChore({ name: 'Test Chore' });
      
      // Verify storage was called
      expect(guestStorage.saveChores).toHaveBeenCalled();
      expect(guestStorage.saveChores).toHaveBeenCalledWith([chore]);
      
      // Verify chore can be retrieved
      (guestStorage.getChores as jest.Mock).mockResolvedValue([chore]);
      const retrieved = await service.getChores();
      expect(retrieved).toContainEqual(expect.objectContaining({ name: 'Test Chore' }));
    });
  });
});
