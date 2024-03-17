import { User } from 'src/users/entities/user.entity';
import { PhotoComment } from '../entities/photo-comment.entity';
import { PhotoFile } from '../entities/photoFile.entity';

export class PhotoOutput {
  id: number;
  author: User;
  familyId: number;
  theme: string;
  payload: string;
  files: PhotoFile[];
  commentsCount: number;
  likesCount: number;
  isLiked: boolean;
  commentsPreview: PhotoComment[];
  // isKept: boolean;
}

export class PhotoMeta {
  id: number;
  author: User;
  familyId: number;
  theme: string;
  payload: string;
  files: PhotoFile[];
  filesCount: number;
}
