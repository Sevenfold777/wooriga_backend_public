import { Module } from '@nestjs/common';
import {
  PhotoCommentsService,
  PhotosService,
  PhotoThemesService,
} from './photos.service';
import {
  PhotoCommentsController,
  PhotosController,
  PhotoThemesController,
} from './photos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './entities/photo.entity';
import { PhotoComment } from './entities/photo-comment.entity';
import { User } from 'src/users/entities/user.entity';
import { Family } from 'src/family/entities/familiy.entity';
import { PhotoFile } from './entities/photoFile.entity';
import { PhotoCommentLike } from './entities/photo-comment-like.entity';
import { PhotoLike } from './entities/photo-like.entity';
import { Theme } from './entities/theme.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { UploadsModule } from 'src/uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Family,
      Photo,
      PhotoFile,
      PhotoComment,
      PhotoCommentLike,
      PhotoLike,
      Theme,
    ]),
    NotificationModule,
    UploadsModule,
  ],
  controllers: [
    PhotosController,
    PhotoCommentsController,
    PhotoThemesController,
  ],
  providers: [PhotosService, PhotoCommentsService, PhotoThemesService],
  exports: [PhotosService],
})
export class PhotosModule {}
