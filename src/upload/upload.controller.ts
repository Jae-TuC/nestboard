import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Uploads')
@ApiBearerAuth('token')
@Controller('uploads')
export class UploadController {
  constructor(
    private readonly uploadsService: UploadService,
  ) {}

  @Post('image')
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
  @UseInterceptors(
    FileInterceptor('file'),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadsService.uploadImage(file);
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Post('document')
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
  @UseInterceptors(
    FileInterceptor('file'),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadsService.uploadDocument(file);
    return {
      success: true,
      message: 'Document uploaded successfully',
      data: result,
    };
  }
}