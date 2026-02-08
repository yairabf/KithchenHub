import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ImageProcessingService } from '../images/image-processing.service';
import { StoragePort } from '../../../infrastructure/storage/storage.interface';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

const resolveSignedUrlTtlSeconds = (configService: ConfigService) => {
  const configuredTtl = configService.get<number>(
    'RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS',
  );
  if (Number.isFinite(configuredTtl) && (configuredTtl as number) > 0) {
    return configuredTtl as number;
  }
  return DEFAULT_SIGNED_URL_TTL_SECONDS;
};

@Injectable()
export class RecipeImagesService {
  private readonly logger = new Logger(RecipeImagesService.name);
  private readonly signedUrlTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProcessing: ImageProcessingService,
    @Inject('StoragePort') private readonly storage: StoragePort,
    private readonly configService: ConfigService,
  ) {
    this.signedUrlTtlSeconds = resolveSignedUrlTtlSeconds(this.configService);
  }

  async uploadRecipeImage(
    recipeId: string,
    file: Buffer,
    mimeType: string,
    householdId: string,
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.householdId !== householdId) {
      throw new NotFoundException('Recipe not found in household');
    }

    // 1. Process Image
    const { main, thumbnail } = await this.imageProcessing.processImage(file);

    // 2. Increment Version
    const newVersion = recipe.imageVersion + 1;
    const imageKey = `households/${householdId}/recipes/${recipeId}/image_v${newVersion}.webp`;
    const thumbKey = `households/${householdId}/recipes/${recipeId}/thumb_v${newVersion}.webp`;
    const cacheControl = 'public, max-age=31536000, immutable';
    const metadata = {
      householdId,
      recipeId,
      imageVersion: String(newVersion),
    };

    // 3. Upload to Storage
    await Promise.all([
      this.storage.putObject(
        imageKey,
        main,
        'image/webp',
        cacheControl,
        metadata,
      ),
      this.storage.putObject(
        thumbKey,
        thumbnail,
        'image/webp',
        cacheControl,
        metadata,
      ),
    ]);

    // 4. Update DB
    const updatedRecipe = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        imageVersion: newVersion,
        imageKey,
        thumbKey,
        imageUrl: null, // Clear legacy URL
        imageUpdatedAt: new Date(),
      },
    });

    // 5. Generate Signed URLs
    const [signedImageUrl, signedThumbUrl] = await Promise.all([
      this.storage.getSignedUrl(imageKey, this.signedUrlTtlSeconds),
      this.storage.getSignedUrl(thumbKey, this.signedUrlTtlSeconds),
    ]);

    return {
      ...updatedRecipe,
      imageUrl: signedImageUrl,
      thumbUrl: signedThumbUrl,
    };
  }

  async getRecipeImageUrls(recipe: {
    imageKey: string | null;
    thumbKey: string | null;
  }) {
    if (!recipe.imageKey) return { imageUrl: null, thumbUrl: null };

    const [imageUrl, thumbUrl] = await Promise.all([
      this.storage.getSignedUrl(recipe.imageKey, this.signedUrlTtlSeconds),
      recipe.thumbKey
        ? this.storage.getSignedUrl(recipe.thumbKey, this.signedUrlTtlSeconds)
        : null,
    ]);

    return { imageUrl, thumbUrl };
  }
}
