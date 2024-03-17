import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import {
  CommentPhotoInput,
  EditPhotoCommentInput,
} from './dtos/comment-photo.dto';
import { CreatePhotoInput } from './dtos/create-photo.dto';
import { EditPhotoInput } from './dtos/edit-photo.dto';
import { PhotoMeta, PhotoOutput } from './dtos/photo-output.dto';
import { PhotoComment } from './entities/photo-comment.entity';
import { PhotoLike } from './entities/photo-like.entity';
import { Photo } from './entities/photo.entity';
import { Theme } from './entities/theme.entity';
import {
  PhotoCommentsService,
  PhotosService,
  PhotoThemesService,
} from './photos.service';

/** Photo Controller */
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /** createPhoto */
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  createPhoto(
    @AuthUser() user: UserId,
    @Body() createPhotoInput: CreatePhotoInput,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BaseOutput> {
    return this.photosService.createPhoto(user, createPhotoInput, files);
  }

  /** deletePhoto */
  @Delete(':id')
  deletePhoto(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.photosService.deletePhoto(user, id);
  }

  /** updatePhoto */
  @Patch(':id')
  editPhoto(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() editPhotoInput: EditPhotoInput,
  ): Promise<BaseOutput> {
    return this.photosService.editPhoto(user, id, editPhotoInput);
  }

  /** findMyPhoto */
  @Get('my')
  findMyPhotos(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<PhotoMeta[]> {
    return this.photosService.findMyPhotos(user, prev);
  }

  /** findFamilyPhoto */
  @Get('family')
  findFamilyPhotos(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<PhotoMeta[]> {
    return this.photosService.findFamilyPhotos(user, prev);
  }

  /** findPhoto */
  @Get(':id')
  findPhoto(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<PhotoOutput> {
    return this.photosService.findPhoto(user, id);
  }

  /** like Photo */
  @Post(':id/like')
  likePhoto(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.photosService.likePhoto(user, id);
  }

  /** like Photo */
  @Delete(':id/unlike')
  unlikePhoto(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.photosService.unlikePhoto(user, id);
  }

  /** find Likes */
  @Get(':id/likes')
  findLikes(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<PhotoLike[]> {
    return this.photosService.findLikes(user, id);
  }
}

/** Photo Comment Contoller */
@Controller('photo/comments')
export class PhotoCommentsController {
  constructor(private readonly commentsService: PhotoCommentsService) {}

  /** createPhotoComment */
  @Post(':id')
  commentPhoto(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() commentPhotoInput: CommentPhotoInput,
  ): Promise<BaseOutput> {
    return this.commentsService.commentPhoto(user, id, commentPhotoInput);
  }

  /** deleteComment */
  @Delete(':id')
  deleteComment(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.commentsService.deleteComment(user, id);
  }

  /** editComment */
  @Patch(':id')
  editComment(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() editCommentInput: EditPhotoCommentInput,
  ): Promise<BaseOutput> {
    return this.commentsService.editComment(user, id, editCommentInput);
  }

  /** findPhotoComments */
  @Get(':id')
  findPhotoComments(
    @AuthUser() user: UserId,
    @Param('id') photoId: number,
    @Query('prev') prev: number,
  ): Promise<PhotoComment[]> {
    return this.commentsService.findPhotoComments(user, photoId, prev);
  }

  /** create Like Comment */
  @Post(':id/like')
  likeComment(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.commentsService.likeComment(user, id);
  }

  /** Delete Like Commnet */
  @Delete(':id/unlike')
  unlikeComment(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.commentsService.unlikeComment(user, id);
  }
}

@Controller('photo/themes')
export class PhotoThemesController {
  constructor(private readonly themesService: PhotoThemesService) {}

  /** findTheme */
  @Get('today')
  findThemeToday(): Promise<Theme> {
    return this.themesService.findThemeToday();
  }

  /** findThemes*/
  @Get()
  findThemes(@Query('prev') prev: number): Promise<Theme[]> {
    return this.themesService.findThemes(prev);
  }
}
