import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import {
  RECIPE_IMAGE_MAIN_MAX_DIMENSION,
  RECIPE_IMAGE_THUMB_SIZE,
  RECIPE_IMAGE_MAIN_WEBP_QUALITY,
  RECIPE_IMAGE_THUMB_WEBP_QUALITY,
  RECIPE_IMAGE_MAX_INPUT_DIMENSION,
  RECIPE_IMAGE_MAX_INPUT_PIXELS,
} from '../../../common/constants';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async processImage(
    buffer: Buffer,
  ): Promise<{ main: Buffer; thumbnail: Buffer }> {
    try {
      await this.assertInputDimensions(buffer);

      const main = await sharp(buffer, {
        limitInputPixels: RECIPE_IMAGE_MAX_INPUT_PIXELS,
      })
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

      const thumbnail = await sharp(buffer, {
        limitInputPixels: RECIPE_IMAGE_MAX_INPUT_PIXELS,
      })
        .resize(RECIPE_IMAGE_THUMB_SIZE, RECIPE_IMAGE_THUMB_SIZE, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        })
        .webp({ quality: RECIPE_IMAGE_THUMB_WEBP_QUALITY })
        .toBuffer();

      return { main, thumbnail };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to process image', error);
      throw new BadRequestException(
        'Image could not be processed. Please use a valid JPG, PNG or WebP image.',
      );
    }
  }

  private async assertInputDimensions(buffer: Buffer): Promise<void> {
    try {
      const metadata = await sharp(buffer, {
        limitInputPixels: RECIPE_IMAGE_MAX_INPUT_PIXELS,
      }).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (!width || !height) {
        throw new BadRequestException(
          'Image dimensions could not be determined.',
        );
      }

      if (
        width > RECIPE_IMAGE_MAX_INPUT_DIMENSION ||
        height > RECIPE_IMAGE_MAX_INPUT_DIMENSION
      ) {
        throw new BadRequestException(
          `Image dimensions too large. Max ${RECIPE_IMAGE_MAX_INPUT_DIMENSION}px per side.`,
        );
      }

      if (width * height > RECIPE_IMAGE_MAX_INPUT_PIXELS) {
        throw new BadRequestException(
          `Image too large. Max ${RECIPE_IMAGE_MAX_INPUT_PIXELS} pixels.`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn('Failed to read image metadata', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BadRequestException(
        'Image could not be processed. Please use a valid JPG, PNG or WebP image.',
      );
    }
  }
}
