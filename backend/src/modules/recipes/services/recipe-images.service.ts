import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ImageProcessingService } from '../images/image-processing.service';
import { StoragePort } from '../../../infrastructure/storage/storage.interface';

@Injectable()
export class RecipeImagesService {
  private readonly logger = new Logger(RecipeImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageProcessing: ImageProcessingService,
    @Inject('StoragePort') private readonly storage: StoragePort,
  ) {}

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
    const imageKey = `recipes/${recipeId}/image_v${newVersion}.webp`;
    const thumbKey = `recipes/${recipeId}/thumb_v${newVersion}.webp`;

    // 3. Upload to Storage
    await Promise.all([
      this.storage.upload(imageKey, main, 'image/webp'),
      this.storage.upload(thumbKey, thumbnail, 'image/webp'),
    ]);

    // 4. Update DB
    const updatedRecipe = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        imageVersion: newVersion,
        imageKey,
        thumbKey,
        imageUrl: null, // Clear legacy URL
      },
    });

    // 5. Generate Signed URLs
    const [signedImageUrl, signedThumbUrl] = await Promise.all([
      this.storage.getSignedUrl(imageKey),
      this.storage.getSignedUrl(thumbKey),
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
      this.storage.getSignedUrl(recipe.imageKey),
      recipe.thumbKey ? this.storage.getSignedUrl(recipe.thumbKey) : null,
    ]);

    return { imageUrl, thumbUrl };
  }
}
