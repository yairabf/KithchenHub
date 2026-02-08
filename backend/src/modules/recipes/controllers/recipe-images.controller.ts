import {
  Controller,
  Post,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { RecipeImagesService } from '../services/recipe-images.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('recipes')
@Controller({ path: 'recipes', version: '1' })
@UseGuards(JwtAuthGuard)
export class RecipeImagesController {
  constructor(private readonly recipeImagesService: RecipeImagesService) {}

  @Post(':id/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(
    @Param('id') id: string,
    @Req() req: any, // Using any for FastifyRequest with multipart support
  ) {
    const householdId = req.user.householdId;

    const data = await req.file();
    if (!data) {
      throw new BadRequestException('File is required');
    }

    // Basic file type validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(data.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG and WebP are allowed.',
      );
    }

    const buffer = await data.toBuffer();

    // Size validation (multipart limit is 5MB in main.ts)
    if (buffer.length > 5 * 1024 * 1024) {
      // 5MB
      throw new BadRequestException('File too large. Max 5MB allowed.');
    }

    return this.recipeImagesService.uploadRecipeImage(
      id,
      buffer,
      data.mimetype,
      householdId,
    );
  }
}
