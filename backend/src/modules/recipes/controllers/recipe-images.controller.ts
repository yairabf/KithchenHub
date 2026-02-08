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

const INVALID_IMAGE_TYPE_MESSAGE =
  'Invalid file type. Only JPG, PNG and WebP are allowed.';

const isAllowedImageType = (mimeType?: string | null) =>
  Boolean(mimeType) &&
  RECIPE_IMAGE_ALLOWED_MIME_TYPES.includes(
    mimeType as RecipeImageAllowedMimeType,
  );

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
    if (!isAllowedImageType(data.mimetype)) {
      throw new BadRequestException(INVALID_IMAGE_TYPE_MESSAGE);
    }

    const buffer = await data.toBuffer();

    if (buffer.length > RECIPE_IMAGE_MAX_SIZE_BYTES) {
      throw new BadRequestException('File too large. Max 5MB allowed.');
    }

    // file-type@16 is CJS; require() avoids ERR_REQUIRE_ESM when tsconfig module is commonjs
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FileType = require('file-type') as {
      fromBuffer: (
        buf: Buffer,
      ) => Promise<{ mime: string; ext: string } | undefined>;
    };
    const detected = await FileType.fromBuffer(buffer);
    if (!detected || !isAllowedImageType(detected.mime)) {
      throw new BadRequestException(INVALID_IMAGE_TYPE_MESSAGE);
    }

    return buffer;
  }
}
