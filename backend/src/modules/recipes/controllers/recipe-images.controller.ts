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
import {
  RECIPE_IMAGE_ALLOWED_MIME_TYPES,
  RECIPE_IMAGE_MAX_SIZE_BYTES,
  RecipeImageAllowedMimeType,
} from '../../../common/constants';

type RecipeImageUploadRequest = {
  user: { householdId: string };
  file: () => Promise<{
    mimetype: string;
    toBuffer: () => Promise<Buffer>;
  } | null>;
};

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
    @Req() req: RecipeImageUploadRequest,
  ) {
    const householdId = req.user.householdId;

    const data = await req.file();
    if (!data) {
      throw new BadRequestException('File is required');
    }

    const buffer = await this.validateImageFile(data);

    return this.recipeImagesService.uploadRecipeImage(
      id,
      buffer,
      data.mimetype,
      householdId,
    );
  }

  private async validateImageFile(data: {
    mimetype: string;
    toBuffer: () => Promise<Buffer>;
  }): Promise<Buffer> {
    if (
      !RECIPE_IMAGE_ALLOWED_MIME_TYPES.includes(
        data.mimetype as RecipeImageAllowedMimeType,
      )
    ) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG and WebP are allowed.',
      );
    }

    const buffer = await data.toBuffer();

    if (buffer.length > RECIPE_IMAGE_MAX_SIZE_BYTES) {
      throw new BadRequestException('File too large. Max 5MB allowed.');
    }

    return buffer;
  }
}
