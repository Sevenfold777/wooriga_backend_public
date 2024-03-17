import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { Message } from 'src/messages/entities/message.entity';
import { MessageFamily } from 'src/messages/entities/message-family.entity';
import { Letter } from 'src/letter/entities/letter.entity';
import { LetterTheme } from 'src/letter/entities/letter-theme.entity';
import { LetterHashtag } from 'src/letter/entities/letter-hashtag.entity';
import { LetterExample } from 'src/letter/entities/letter-example.entity';
import {
  AdminControllerLetter,
  AdminControllerMessage,
  AdminControllerPhoto,
  AdminControllerUser,
} from './admin.controller';
import {
  AdminServiceLetter,
  AdminServiceMessage,
  AdminServicePhoto,
  AdminServiceUser,
} from './admin.service';
import { MessageFamilyComment } from 'src/messages/entities/message-family-comment.entity';
import { MessageFamilyMetoo } from 'src/messages/entities/message-family-metoo.entity';
import { Family } from 'src/family/entities/familiy.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { Photo } from 'src/photos/entities/photo.entity';
import { PhotoComment } from 'src/photos/entities/photo-comment.entity';
import { PhotoLike } from 'src/photos/entities/photo-like.entity';
import { User } from 'src/users/entities/user.entity';
import { UserAuth } from 'src/users/entities/user-auth.entity';
import { FamilyPedia } from 'src/family-pedia/entities/family-pedia.entity';
import { DailyEmotion } from 'src/emotions/entities/emotion.entity';
import { DAU } from './entities/dau.entity';
import { MAU } from './entities/mau.entity';
import { LetterGuide } from 'src/letter/entities/letter-guide.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      Message,
      MessageFamily,
      MessageFamilyComment,
      MessageFamilyMetoo,
      Letter,
      LetterTheme,
      LetterHashtag,
      LetterExample,
      Family,
      Photo,
      PhotoComment,
      PhotoLike,
      User,
      UserAuth,
      FamilyPedia,
      DailyEmotion,
      DAU,
      MAU,
      LetterGuide,
    ]),
    NotificationModule,
  ],
  controllers: [
    AdminControllerMessage,
    AdminControllerLetter,
    AdminControllerPhoto,
    AdminControllerUser,
  ],
  providers: [
    AdminServiceMessage,
    AdminServiceLetter,
    AdminServicePhoto,
    AdminServiceUser,
  ],
})
export class AdminModule {}
