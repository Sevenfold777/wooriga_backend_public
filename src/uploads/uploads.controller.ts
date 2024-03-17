import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { UploadsService } from './uploads.service';
import { User } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/public.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post(':dir')
  @UseInterceptors(FilesInterceptor('files')) // File"s" Interceptor가 될 필요?
  async uploadFile(
    @AuthUser() user: UserId,
    @Param('dir')
    dir: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<string[]> {
    return this.uploadsService.uploadPhotos(user.userId, dir, files);
  }

  // @Public()
  // @Delete()
  // delete(@Body() body: { urls: string[] }) {
  //   return this.uploadsService.deletePhotos(body.urls);
  // }
}
