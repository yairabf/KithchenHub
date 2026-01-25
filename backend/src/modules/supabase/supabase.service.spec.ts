import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from './supabase.service';
import { ConfigService } from '@nestjs/config';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'SUPABASE_URL':
        return 'https://mock.supabase.co';
      case 'SUPABASE_ANON_KEY':
        return 'mock-anon-key';
      case 'SUPABASE_SERVICE_ROLE_KEY':
        return 'mock-service-key';
      default:
        return null;
    }
  }),
};

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize Supabase client on construction', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
    // In a real unit test we might spy on createClient, but here checking it exposes the client is enough
    // tailored to the implementation.
  });

  it('should expose auth and db methods via client', () => {
    const client = service.getClient();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeDefined();
  });
});
