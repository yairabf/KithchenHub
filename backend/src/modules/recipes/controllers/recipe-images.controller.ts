import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecipeImagesService } from '../services/recipe-images.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('recipes')
@Controller({ path: 'recipes', version: '1' })
@UseGuards(JwtAuthGuard)
export class RecipeImagesController {
  constructor(private readonly recipeImagesService: RecipeImagesService) {}

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file'))
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
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    const householdId = req.user.householdId;
    return this.recipeImagesService.uploadRecipeImage(
      id,
      file.buffer,
      file.mimetype,
      householdId,
    );
  }
}
