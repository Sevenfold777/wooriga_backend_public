import { Module } from '@nestjs/common';
import {
  MessageCommentsService,
  MessageFamCommentsService,
  MessageFamilyService,
  MessagesService,
} from './messages.service';
import {
  MessageCommentsController,
  MessageFamCommentsController,
  MessageFamilyController,
  MessagesController,
} from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageComment } from './entities/message-comment.entity';
import { User } from 'src/users/entities/user.entity';
import { MessageFamily } from './entities/message-family.entity';
import { Family } from 'src/family/entities/familiy.entity';
import { MessageFamilyComment } from './entities/message-family-comment.entity';
import { MessageFamilyCommentLike } from './entities/message-family-comment-like.entity';
import { MessageCommentLike } from './entities/message-comment-like.entity';
import { MessageMetoo } from './entities/message-metoo.entity';
import { MessageFamilyMetoo } from './entities/message-family-metoo.entity';
import { MessageFamilyKeep } from './entities/message-family-keep.entity';
import { MessageKeep } from './entities/message-keep.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Family,
      Message,
      MessageComment,
      MessageFamily,
      MessageFamilyComment,
      MessageCommentLike,
      MessageFamilyCommentLike,
      MessageMetoo,
      MessageFamilyMetoo,
      MessageFamilyKeep,
      MessageKeep,
    ]),
    NotificationModule,
  ],
  controllers: [
    MessagesController,
    MessageCommentsController,
    MessageFamilyController,
    MessageFamCommentsController,
  ],
  providers: [
    MessagesService,
    MessageCommentsService,
    MessageFamilyService,
    MessageFamCommentsService,
  ],
})
export class MessagesModule {}
