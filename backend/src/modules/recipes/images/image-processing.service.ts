import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async processImage(
    buffer: Buffer,
  ): Promise<{ main: Buffer; thumbnail: Buffer }> {
    try {
      const main = await sharp(buffer)
        .resize(1600, 1600, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnail = await sharp(buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        })
        .webp({ quality: 75 })
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
