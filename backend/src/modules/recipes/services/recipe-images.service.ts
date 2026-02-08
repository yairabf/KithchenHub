import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ImageProcessingService } from '../images/image-processing.service';
import { StoragePort } from '../../../infrastructure/storage/storage.interface';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Reads RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS from config. ConfigService may return
 * raw env strings, so we parse with Number() and validate instead of assuming
 * a number type.
 */
const resolveSignedUrlTtlSeconds = (configService: ConfigService): number => {
  const raw = configService.get<string | number>(
    'RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS',
  );
  const parsed =
    typeof raw === 'number' ? raw : raw != null ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
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
    const startedAt = Date.now();
    let processingMs = 0;

    try {
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
      const processingStart = Date.now();
      const { main, thumbnail } = await this.imageProcessing.processImage(file);
      processingMs = Date.now() - processingStart;

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
      try {
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
      } catch (error) {
        this.logger.error('Recipe image storage error', {
          recipeId,
          householdId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

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

      this.logger.log('Recipe image upload success', {
        recipeId,
        householdId,
        processingMs,
        totalMs: Date.now() - startedAt,
      });

      return {
        ...updatedRecipe,
        imageUrl: signedImageUrl,
        thumbUrl: signedThumbUrl,
      };
    } catch (error) {
      this.logger.error('Recipe image upload failed', {
        recipeId,
        householdId,
        processingMs,
        totalMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
