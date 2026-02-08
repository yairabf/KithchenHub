import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import {
  RECIPE_IMAGE_MAIN_MAX_DIMENSION,
  RECIPE_IMAGE_THUMB_SIZE,
  RECIPE_IMAGE_MAIN_WEBP_QUALITY,
  RECIPE_IMAGE_THUMB_WEBP_QUALITY,
} from '../../../common/constants';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async processImage(
    buffer: Buffer,
  ): Promise<{ main: Buffer; thumbnail: Buffer }> {
    try {
      const main = await sharp(buffer)
        .resize(
          RECIPE_IMAGE_MAIN_MAX_DIMENSION,
          RECIPE_IMAGE_MAIN_MAX_DIMENSION,
          {
            fit: 'inside',
            withoutEnlargement: true,
          },
        )
        .webp({ quality: RECIPE_IMAGE_MAIN_WEBP_QUALITY })
        .toBuffer();

      const thumbnail = await sharp(buffer)
        .resize(RECIPE_IMAGE_THUMB_SIZE, RECIPE_IMAGE_THUMB_SIZE, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        })
        .webp({ quality: RECIPE_IMAGE_THUMB_WEBP_QUALITY })
        .toBuffer();

      return { main, thumbnail };
    } catch (error) {
      this.logger.error('Failed to process image', error);
      throw new BadRequestException(
        'Image could not be processed. Please use a valid JPG, PNG or WebP image.',
      );
    }
  }
}
