import { Injectable, UploadedFiles } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Family } from 'src/family/entities/familiy.entity';
import { User } from 'src/users/entities/user.entity';
import { In, Not, Repository } from 'typeorm';
import {
  CommentPhotoInput,
  EditPhotoCommentInput,
} from './dtos/comment-photo.dto';
import { CreatePhotoInput } from './dtos/create-photo.dto';
import { EditPhotoInput } from './dtos/edit-photo.dto';
import { PhotoMeta, PhotoOutput } from './dtos/photo-output.dto';
import { PhotoCommentLike } from './entities/photo-comment-like.entity';
import { PhotoComment } from './entities/photo-comment.entity';
import { PhotoLike } from './entities/photo-like.entity';
import { Photo } from './entities/photo.entity';
import { PhotoFile } from './entities/photoFile.entity';
import { Theme } from './entities/theme.entity';
import * as sharp from 'sharp';
import axios from 'axios';
import { NotificationService } from 'src/notification/notification.service';
import { UploadsService } from 'src/uploads/uploads.service';
import { Status } from 'src/common/entities/comment.entity';
import { ROUTE_NAME } from 'src/common/navigation-route';
import { UserId } from 'src/auth/auth-user.decorator';

/** Photo Service */
@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Family) private familyRepository: Repository<Family>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(PhotoFile) private fileRespository: Repository<PhotoFile>,
    @InjectRepository(PhotoLike) private likeRepository: Repository<PhotoLike>,
    @InjectRepository(PhotoComment)
    private commentRepository: Repository<PhotoComment>,
    private readonly notificationService: NotificationService,
    private readonly uploadService: UploadsService,
  ) {}

  /** createPhoto */
  async createPhoto(
    { userId, familyId }: UserId,
    { theme, payload }: CreatePhotoInput,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<BaseOutput> {
    const S3DirName = 'photos';

    if (files.length === 0) {
      return { ok: false, error: 'Photo not sent.' };
    }

    // 1. upload photo
    const urls = await this.uploadService.uploadPhotos(
      userId,
      S3DirName,
      files,
    );

    // 2. create Photo
    const photo = this.photoRepository.create({
      author: { id: userId },
      family: { id: familyId },
      theme,
      payload,
    });

    try {
      await this.photoRepository.save(photo);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    const { id: photoId } = photo;

    // 2. create files
    for (const url of urls) {
      const imageBuffer = (await axios({ url, responseType: 'arraybuffer' }))
        .data as Buffer;

      const metadata = await sharp(imageBuffer).metadata();

      const file = this.fileRespository.create({
        url,
        photo: { id: photoId },
        width: metadata.width,
        height: metadata.height,
      });
      await this.fileRespository.save(file); // 나중에 global exception handler로 처리하자
    }

    const familyMembers = await this.userRepository.find({
      select: ['fcmToken', 'id'],
      where: {
        status: Status.ACTIVE,
        family: { id: familyId },
        id: Not(userId),
        fcmToken: Not(''),
      },
    });

    await this.notificationService.sendNotification({
      tokens: familyMembers.map((user) => user.fcmToken),
      title: '우리가 앨범',
      body: '새로운 사진이 업로드 되었습니다.',
      screen: ROUTE_NAME.PHOTO,
      param: { photoId: photoId },
      senderId: userId,
      receiversId: familyMembers.map((user) => user.id),
    });

    return { ok: true };
  }

  /** deletePhoto */
  async deletePhoto(
    { userId, familyId }: UserId,
    id: number,
  ): Promise<BaseOutput> {
    const targetPhoto = await this.photoRepository.findOne({
      where: { id, author: { id: userId } },
      relations: { files: true, comments: true },
      select: ['files'],
    });

    const fileUrls = targetPhoto.files.map((file) => file.url);
    const commentIds = targetPhoto.comments.map((comment) => comment.id);

    const result = await this.photoRepository.delete({
      id,
      author: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: 'Photo not found.' };
    }

    // delete from S3
    await this.uploadService.deletePhotos(fileUrls);

    // update Comments
    await this.commentRepository.update(
      { id: In(commentIds) },
      { status: Status.DELETED },
    );

    return { ok: true };
  }

  /** updatePhoto */
  async editPhoto(
    { userId, familyId }: UserId,
    id: number,
    { payload }: EditPhotoInput,
  ): Promise<BaseOutput> {
    const result = await this.photoRepository.update(
      { id, author: { id: userId } },
      { payload },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Photo not found.' };
    }

    return { ok: true };
  }

  /** findMyPhotos */
  async findMyPhotos(
    { userId, familyId }: UserId,
    prev: number,
  ): Promise<PhotoMeta[]> {
    const take = 20;

    const photos = await this.photoRepository.find({
      where: { author: { id: userId } },
      relations: { files: true, author: true },
      order: { createdAt: 'DESC' },
      take,
      skip: prev * take,
    });

    const photosOutput = photos.map((photo) => {
      return {
        id: photo.id,
        author: photo.author,
        familyId,
        theme: photo.theme,
        payload: photo.payload,
        files: photo.files.sort((a, b) => a.id - b.id), // oreder by file.id
        filesCount: photo.files.length,
      };
    });

    return photosOutput;
  }

  /** findFamilyPhotos */
  async findFamilyPhotos(
    { userId, familyId }: UserId,
    prev: number,
  ): Promise<PhotoMeta[]> {
    const take = 20;

    const photos = await this.photoRepository.find({
      where: { family: { id: familyId } },
      relations: { files: true, author: true },
      order: { createdAt: 'DESC' },
      take,
      skip: prev * take,
    });

    const photosOutput = photos.map((photo) => {
      return {
        id: photo.id,
        author: photo.author,
        familyId,
        theme: photo.theme,
        payload: photo.payload,
        files: photo.files.sort((a, b) => a.id - b.id), // oreder by file.id
        filesCount: photo.files.length,
      };
    });

    return photosOutput;
  }

  /** findPhoto */
  async findPhoto(
    { userId, familyId }: UserId,
    id: number,
  ): Promise<PhotoOutput> {
    const photo = await this.photoRepository.findOne({
      where: {
        id,
        family: { id: familyId },
      },
      relations: { files: true, author: true, comments: true, likes: true },
    });

    const commments = photo.comments.filter(
      (comment) => comment.status === Status.ACTIVE,
    );

    return {
      id: photo.id,
      author: photo.author,
      familyId,
      theme: photo.theme,
      payload: photo.payload,
      files: photo.files.sort((a, b) => a.id - b.id), // oreder by file.id
      commentsCount: commments.length,
      commentsPreview: commments
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(-2),
      likesCount: photo.likes.length,
      isLiked: Boolean(photo.likes.find((like) => like.user.id === userId)),
    };
  }

  /** like Photo */
  async likePhoto({ userId }: UserId, id: number): Promise<BaseOutput> {
    const exist = await this.likeRepository.findOne({
      where: { photo: { id }, user: { id: userId } },
    });

    if (exist) {
      return { ok: false, error: 'Already Liked.' };
    }

    const metoo = this.likeRepository.create({
      photo: { id },
      user: { id: userId },
    });

    try {
      await this.likeRepository.save(metoo);
    } catch (e) {
      return { ok: false, error: "Couldn't liked Photo." };
    }

    return { ok: true };
  }

  /** unlike Message */
  async unlikePhoto({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.likeRepository.delete({
      photo: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Coudn't delete like." };
    }

    return { ok: true };
  }

  /** find Likes */
  async findLikes({ familyId }: UserId, id: number): Promise<PhotoLike[]> {
    const photo = await this.photoRepository.findOne({
      where: { id, family: { id: familyId } },
      relations: { likes: true },
      select: ['likes'],
    });

    return photo.likes;
  }
}

/** Photo Comments Service */
@Injectable()
export class PhotoCommentsService {
  constructor(
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(PhotoComment)
    private commentRepository: Repository<PhotoComment>,
    @InjectRepository(PhotoCommentLike)
    private likeRepository: Repository<PhotoCommentLike>,
    private readonly notificationService: NotificationService,
  ) {}
  /** createPhotoComment */
  async commentPhoto(
    { userId, familyId }: UserId,
    id: number,
    commmentPhotoInput: CommentPhotoInput,
  ): Promise<BaseOutput> {
    // create comment
    const comment = this.commentRepository.create({
      photo: { id },
      author: { id: userId },
      ...commmentPhotoInput,
    });

    try {
      await this.commentRepository.save(comment);
    } catch (e) {
      return { ok: false, error: "Couldn't create the comment." };
    }

    const familyMembers = await this.userRepository.find({
      select: ['fcmToken', 'id'],
      where: {
        status: Status.ACTIVE,
        family: { id: familyId },
        id: Not(userId),
        fcmToken: Not(''),
      },
    });

    await this.notificationService.sendNotification({
      tokens: familyMembers.map((user) => user.fcmToken),
      title: '우리가 앨범',
      body: `우리 가족이 사진에 댓글을 작성했습니다. "${
        commmentPhotoInput.payload.length > 8
          ? commmentPhotoInput.payload.slice(0, 8) + '...'
          : commmentPhotoInput.payload
      }"`,
      screen: ROUTE_NAME.PHOTO,
      param: {
        photoId: id,
      },
      senderId: userId,
      receiversId: familyMembers.map((user) => user.id),
    });

    return { ok: true };
  }

  /** deleteComment */
  async deleteComment({ userId }: UserId, id: number): Promise<BaseOutput> {
    // const result = await this.commentRepository.delete({
    //   id,
    //   author: { id: userId },
    // });
    const result = await this.commentRepository.update(
      {
        id,
        author: { id: userId },
      },
      {
        status: Status.DELETED,
      },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Comment Not found.' };
    }

    return { ok: true };
  }

  /** editComment */
  async editComment(
    { userId }: UserId,
    id: number,
    editCommentInput: EditPhotoCommentInput,
  ): Promise<BaseOutput> {
    const result = await this.commentRepository.update(
      { id, author: { id: userId } },
      editCommentInput,
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Comment Not found.' };
    }

    return { ok: true };
  }

  /** findPhotoComments */
  async findPhotoComments(
    { familyId }: UserId,
    photoId: number,
    prev: number,
  ): Promise<PhotoComment[]> {
    const take = 20;

    const comments = await this.commentRepository.find({
      where: {
        photo: { id: photoId, family: { id: familyId } },
        status: Status.ACTIVE,
      },
      order: { createdAt: 'DESC' },
      take,
      skip: prev * take,
    });

    return comments;
  }

  /** create Like Comment */
  async likeComment({ userId }: UserId, id: number): Promise<BaseOutput> {
    const exist = await this.likeRepository.findOne({
      where: { comment: { id }, user: { id: userId } },
    });

    if (exist) {
      return { ok: false, error: 'Already Liked.' };
    }

    const like = this.likeRepository.create({
      user: { id: userId },
      comment: { id },
    });

    try {
      await this.likeRepository.save(like);
    } catch (e) {
      return { ok: false, error: "Couldn't like the comment." };
    }

    return { ok: true };
  }

  /** Delete Like Commnet */
  async unlikeComment({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.likeRepository.delete({
      comment: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false };
    }

    return { ok: true };
  }
}

@Injectable()
export class PhotoThemesService {
  constructor(
    @InjectRepository(Theme) private themeRepository: Repository<Theme>,
  ) {}

  /** findTheme */
  async findThemeToday(): Promise<Theme> {
    const today = new Date().toLocaleDateString('ko-KR');

    return this.themeRepository.findOne({
      where: { lastShowedAt: new Date(today) },
    });
  }

  /** findThemes*/
  findThemes(prev: number): Promise<Theme[]> {
    const take = 20;

    return this.themeRepository.find({
      order: { lastShowedAt: 'DESC' },
      take,
      skip: prev * take,
    });
  }
}
