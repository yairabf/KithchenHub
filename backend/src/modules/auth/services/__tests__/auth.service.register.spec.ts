import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../../repositories/auth.repository';
import { HouseholdsService } from '../../../households/services/households.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { UuidService } from '../../../../common/services/uuid.service';
import { EmailService } from '../email.service';
import { RegisterDto } from '../../dtos';
import { JwtService } from '@nestjs/jwt';

// Create a variable to hold the mock config that can be modified per test
const mockLoadConfiguration = jest.fn();

// Mock loadConfiguration to avoid environment variable validation in tests
jest.mock('../../../../config/configuration', () => ({
  loadConfiguration: () => mockLoadConfiguration(),
}));

describe('AuthService - Register', () => {
  let service: AuthService;
  let emailService: EmailService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockAuthRepository = {
    createRefreshToken: jest.fn(),
    deleteAllRefreshTokensForUser: jest.fn().mockResolvedValue(undefined),
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockUuidService = {
    generate: jest.fn(),
  };

  const mockHouseholdsService = {
    createHouseholdForNewUser: jest.fn(),
    addUserToHousehold: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  // Helper to set config for tests
  const setMockConfig = (skipEmailVerification: boolean) => {
    mockLoadConfiguration.mockReturnValue({
      google: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      },
      jwt: {
        secret: 'test-jwt-secret-32-characters-long',
        refreshSecret: 'test-refresh-secret-32-characters-long',
        expiresIn: '15m',
        refreshExpiresIn: '7d',
      },
      auth: {
        skipEmailVerification,
      },
      email: {
        verificationTokenExpiryHours: 24,
      },
    });
  };

  beforeEach(async () => {
    // Default config
    setMockConfig(false);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: UuidService, useValue: mockUuidService },
        { provide: HouseholdsService, useValue: mockHouseholdsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);

    // Reset all mocks
    jest.clearAllMocks();

    // Default UUID generation
    mockUuidService.generate.mockReturnValue('generated-user-id');

    // Mock bcrypt hash and other private methods
    jest
      .spyOn(service as any, 'hashPassword')
      .mockResolvedValue('hashed-password');
    jest
      .spyOn(service as any, 'generateEmailVerificationToken')
      .mockReturnValue('verification-token-123');
    jest
      .spyOn(service as any, 'deriveDefaultHouseholdName')
      .mockReturnValue('Default Household');
    jest
      .spyOn(service as any, 'resolveAndAttachHousehold')
      .mockResolvedValue(undefined);
  });

  describe.each([
    [
      'email verification enabled (default)',
      false,
      true,
      false,
      'Please check your email to verify your account',
    ],
    [
      'email verification skipped (dev mode)',
      true,
      false,
      true,
      'Email verification skipped for development',
    ],
  ])(
    'with %s',
    (
      description,
      skipVerification,
      shouldCallEmailService,
      shouldSetEmailVerified,
      expectedMessagePart,
    ) => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      };

      beforeEach(async () => {
        // Set the config for this test iteration BEFORE creating the service
        setMockConfig(skipVerification);

        // Recreate the service with the new config
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            AuthService,
            { provide: PrismaService, useValue: mockPrismaService },
            { provide: JwtService, useValue: mockJwtService },
            { provide: AuthRepository, useValue: mockAuthRepository },
            { provide: UuidService, useValue: mockUuidService },
            { provide: HouseholdsService, useValue: mockHouseholdsService },
            { provide: EmailService, useValue: mockEmailService },
            { provide: ConfigService, useValue: mockConfigService },
          ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        // Reset and setup mocks
        mockAuthRepository.findUserByEmail.mockResolvedValue(null);
        mockAuthRepository.createUser.mockResolvedValue({
          id: 'generated-user-id',
          email: registerDto.email,
          name: registerDto.name,
          emailVerified: shouldSetEmailVerified,
        });

        // Setup spies after service is created
        jest
          .spyOn(service as any, 'hashPassword')
          .mockResolvedValue('hashed-password');
        jest
          .spyOn(service as any, 'generateEmailVerificationToken')
          .mockReturnValue('verification-token-123');
        jest
          .spyOn(service as any, 'deriveDefaultHouseholdName')
          .mockReturnValue('Default Household');
        jest
          .spyOn(service as any, 'resolveAndAttachHousehold')
          .mockResolvedValue(undefined);
      });

      it(`should ${shouldCallEmailService ? 'send' : 'not send'} verification email`, async () => {
        await service.register(registerDto);

        if (shouldCallEmailService) {
          expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
            registerDto.email,
            'verification-token-123',
            registerDto.name,
          );
        } else {
          expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
        }
      });

      it(`should create user with emailVerified=${shouldSetEmailVerified}`, async () => {
        await service.register(registerDto);

        expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            email: registerDto.email,
            emailVerified: shouldSetEmailVerified,
          }),
        );
      });

      it('should return appropriate message', async () => {
        const result = await service.register(registerDto);

        expect(result.message).toContain(expectedMessagePart);
      });

      it(`should ${skipVerification ? 'pass undefined' : 'set'} verification token`, async () => {
        await service.register(registerDto);

        const createCall = mockAuthRepository.createUser.mock.calls[0][0];

        if (skipVerification) {
          // When skipped, tokens are explicitly set to undefined
          expect(createCall).toHaveProperty(
            'emailVerificationToken',
            undefined,
          );
          expect(createCall).toHaveProperty(
            'emailVerificationTokenExpiry',
            undefined,
          );
        } else {
          expect(createCall.emailVerificationToken).toBe(
            'verification-token-123',
          );
          expect(createCall.emailVerificationTokenExpiry).toBeInstanceOf(Date);
        }
      });
    },
  );

  describe('error cases', () => {
    it('should throw ConflictException if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue({
        id: 'existing-user-id',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already registered',
      );
    });

    it('should handle household creation when provided', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
        household: {
          name: 'Test Household',
        },
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue({
        id: 'generated-user-id',
        email: registerDto.email,
        name: registerDto.name,
        emailVerified: false,
      });

      const resolveAndAttachSpy = jest.spyOn(
        service as any,
        'resolveAndAttachHousehold',
      );

      await service.register(registerDto);

      expect(resolveAndAttachSpy).toHaveBeenCalledWith('generated-user-id', {
        name: 'Test Household',
      });
    });
  });

  describe('security validation', () => {
    it('should hash password before storing', async () => {
      const registerDto: RegisterDto = {
        email: 'secure@example.com',
        password: 'MySecurePassword123!',
        name: 'Secure User',
      };

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue({
        id: 'generated-user-id',
        email: registerDto.email,
        name: registerDto.name,
      });

      const hashPasswordSpy = jest.spyOn(service as any, 'hashPassword');

      await service.register(registerDto);

      expect(hashPasswordSpy).toHaveBeenCalledWith(registerDto.password);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: 'hashed-password',
        }),
      );
    });

    it('should generate unique verification token when verification is enabled', async () => {
      const registerDto: RegisterDto = {
        email: 'verify@example.com',
        password: 'Password123!',
        name: 'Verify User',
      };

      mockConfigService.get.mockReturnValue({
        auth: {
          skipEmailVerification: false,
        },
        email: {
          verificationTokenExpiryHours: 24,
        },
      });

      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue({
        id: 'generated-user-id',
        email: registerDto.email,
        name: registerDto.name,
      });

      const generateTokenSpy = jest.spyOn(
        service as any,
        'generateEmailVerificationToken',
      );

      await service.register(registerDto);

      expect(generateTokenSpy).toHaveBeenCalled();
    });
  });
});
