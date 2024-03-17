import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { FamilyModule } from 'src/family/family.module';
import { FamilyPediaModule } from 'src/family-pedia/family-pedia.module';
import { UserAuth } from './entities/user-auth.entity';
import { Photo } from 'src/photos/entities/photo.entity';
import { PhotosModule } from 'src/photos/photos.module';
import { DailyEmotion } from 'src/emotions/entities/emotion.entity';
import { PhotoLike } from 'src/photos/entities/photo-like.entity';
import { MessageMetoo } from 'src/messages/entities/message-metoo.entity';
import { MessageFamilyMetoo } from 'src/messages/entities/message-family-metoo.entity';
import { PhotoCommentLike } from 'src/photos/entities/photo-comment-like.entity';
import { MessageCommentLike } from 'src/messages/entities/message-comment-like.entity';
import { MessageFamilyCommentLike } from 'src/messages/entities/message-family-comment-like.entity';
import { FamilyPedia } from 'src/family-pedia/entities/family-pedia.entity';
import { BalanceChoice } from 'src/balance-game/entities/balance-choice.entity';
import { UploadsModule } from 'src/uploads/uploads.module';
import { BalanceGameComment } from 'src/balance-game/entities/balance-game-comment.entity';
import { BalanceGameFamilyComment } from 'src/balance-game/entities/balance-game-family-comment.entity';
import { PhotoComment } from 'src/photos/entities/photo-comment.entity';
import { MessageComment } from 'src/messages/entities/message-comment.entity';
import { MessageFamilyComment } from 'src/messages/entities/message-family-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserAuth,
      // for delete-user - hard-delete
      Photo,
      MessageFamilyCommentLike,
      MessageCommentLike,
      PhotoCommentLike,
      PhotoLike,
      MessageMetoo,
      MessageFamilyMetoo,
      FamilyPedia,
      BalanceChoice,
      DailyEmotion,
      // for delete-user - soft-delete
      BalanceGameComment,
      BalanceGameFamilyComment,
      PhotoComment,
      MessageComment,
      MessageFamilyComment,
    ]),
    AuthModule,
    FamilyModule,
    FamilyPediaModule,
    UploadsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
