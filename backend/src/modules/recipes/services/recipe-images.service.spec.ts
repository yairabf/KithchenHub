import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RecipeImagesService } from './recipe-images.service';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ImageProcessingService } from '../images/image-processing.service';
import { StoragePort } from '../../../infrastructure/storage/storage.interface';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

describe('RecipeImagesService', () => {
  const mockStorage: StoragePort = {
    putObject: jest.fn().mockResolvedValue(undefined),
    getSignedUrl: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve('https://signed.example.com/url'),
      ),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  async function createTestingModule(
    configGet: (key: string) => string | number | undefined,
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      providers: [
        RecipeImagesService,
        {
          provide: PrismaService,
          useValue: {
            recipe: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ImageProcessingService,
          useValue: {
            processImage: jest.fn().mockResolvedValue({
              main: Buffer.from('main'),
              thumbnail: Buffer.from('thumb'),
            }),
          },
        },
        {
          provide: 'StoragePort',
          useValue: mockStorage,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(configGet),
          },
        },
      ],
    }).compile();
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signed URL TTL (resolveSignedUrlTtlSeconds)', () => {
    it.each<[string, string | number | undefined, number]>([
      ['numeric value', 3600, 3600],
      ['string number', '3600', 3600],
      ['undefined uses default', undefined, DEFAULT_SIGNED_URL_TTL_SECONDS],
      [
        'invalid string uses default',
        'invalid',
        DEFAULT_SIGNED_URL_TTL_SECONDS,
      ],
      ['negative uses default', -1, DEFAULT_SIGNED_URL_TTL_SECONDS],
      ['zero uses default', 0, DEFAULT_SIGNED_URL_TTL_SECONDS],
    ])(
      'when config returns %s, getSignedUrl is called with TTL %i',
      async (_label, configValue, expectedTtl) => {
        const module = await createTestingModule(() => configValue);
        const service = module.get(RecipeImagesService);
        const storage = module.get('StoragePort') as StoragePort;

        await service.getRecipeImageUrls({
          imageKey: 'households/h1/recipes/r1/image_v1.webp',
          thumbKey: 'households/h1/recipes/r1/thumb_v1.webp',
        });

        expect(storage.getSignedUrl).toHaveBeenCalledWith(
          'households/h1/recipes/r1/image_v1.webp',
          expectedTtl,
        );
        expect(storage.getSignedUrl).toHaveBeenCalledWith(
          'households/h1/recipes/r1/thumb_v1.webp',
          expectedTtl,
        );
      },
    );
  });

  describe('getRecipeImageUrls', () => {
    it.each<
      [
        string,
        { imageKey: string | null; thumbKey: string | null },
        { imageUrl: string | null; thumbUrl: string | null },
      ]
    >([
      [
        'no imageKey returns null URLs',
        { imageKey: null, thumbKey: null },
        { imageUrl: null, thumbUrl: null },
      ],
      [
        'imageKey only returns imageUrl and null thumbUrl',
        { imageKey: 'path/image.webp', thumbKey: null },
        { imageUrl: 'https://signed.example.com/url', thumbUrl: null },
      ],
      [
        'imageKey and thumbKey return both URLs',
        { imageKey: 'path/image.webp', thumbKey: 'path/thumb.webp' },
        {
          imageUrl: 'https://signed.example.com/url',
          thumbUrl: 'https://signed.example.com/url',
        },
      ],
    ])('when %s', async (_label, input, expected) => {
      const module = await createTestingModule(() => 3600);
      const service = module.get(RecipeImagesService);

      const result = await service.getRecipeImageUrls(input);

      expect(result).toEqual(expected);
    });
  });
});
