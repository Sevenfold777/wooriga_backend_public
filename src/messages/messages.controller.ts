import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { Public } from 'src/auth/public.decorator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { CommentMessageFamInput } from './dtos/comment-message-family.dto';
import { CommentMessageInput } from './dtos/comment-message.dto';
import { CreateMessageFamInput } from './dtos/create-message-family.dto';
import { CreateMessageInput } from './dtos/create-message.dto';
import {
  EditMessageCommentInput,
  EditMessageFamCommentInput,
} from './dtos/edit-message-comment.dto';
import { EditMessageFamInput } from './dtos/edit-message-family.dto';
import { EditMessageInput } from './dtos/edit-message.dto';
import { MessageFamilyOutput, MessageOutput } from './dtos/message-output.dto';
import { MessageComment } from './entities/message-comment.entity';
import { MessageFamilyComment } from './entities/message-family-comment.entity';
import { MessageFamily } from './entities/message-family.entity';
import { Message } from './entities/message.entity';
import {
  MessageCommentsService,
  MessageFamCommentsService,
  MessageFamilyService,
  MessagesService,
} from './messages.service';

/** Messages Controller (Public) */
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messageFamilyService: MessageFamilyService,
  ) {}

  /** createMessage */
  @Post()
  async sendMessage(
    @AuthUser() user: UserId,
    @Body() createMessageInput: CreateMessageInput,
  ): Promise<BaseOutput> {
    // 1. create "Message"
    const newMessage = await this.messagesService.sendMessage(
      user,
      createMessageInput,
    );

    // 2. create "MessageFamily"
    return this.messageFamilyService.createMessage(user, {
      messageId: newMessage.id,
      isNow: createMessageInput.isNow,
    });
  }

  /** deleteMessage */
  @Delete(':id')
  deleteMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messagesService.deleteMessage(user, id);
  }

  /** updateMessage */
  @Patch(':id')
  async editMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() editMessageInput: EditMessageInput,
  ): Promise<BaseOutput> {
    // edit "Message"
    await this.messagesService.editMessage(user, id, editMessageInput);

    // edit "Message Family"
    return this.messageFamilyService.editMessage(user, {
      messageId: id,
      isNow: editMessageInput.isNow,
    });
  }

  /** findMyVoices */
  @Get('my')
  findMyMessages(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<Message[]> {
    return this.messagesService.findMyMessages(user, prev);
  }

  @Get('keep')
  findMessageKept(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<{ date: string; messages: Message[] }[]> {
    return this.messagesService.findMessagesKept(user, prev);
  }

  /** findAllMessages */
  @Get()
  findAllMessages(
    @AuthUser() user: UserId,
    @Query('limit') limit: number,
    @Query('orderBy') orderBy: string,
    @Query('prev') prev = 0,
  ): Promise<MessageOutput[]> {
    return this.messagesService.findAllMessages(user, limit, orderBy, prev);
  }

  /** findMessage */
  @Get(':id')
  findMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<MessageOutput> {
    return this.messagesService.findMessage(user, id);
  }

  /** MeToo Message */
  @Post(':id/metoo')
  metooMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messagesService.metooMessage(user, id);
  }

  /** quit MeToo Message */
  @Delete(':id/metoo')
  deleteMetooMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messagesService.deleteMetooMessage(user, id);
  }

  /** keep Message */
  @Post(':id/keep')
  keepMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messagesService.keepMessage(user, id);
  }

  /** quit keep Message */
  @Delete(':id/keep')
  deleteKeepMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messagesService.deleteKeepMessage(user, id);
  }
}

/** Comment Controller */
@Controller('message/comments')
export class MessageCommentsController {
  constructor(private readonly commentsService: MessageCommentsService) {}

  /** createMessageComment */
  @Post(':id')
  commentMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() commentMessageInput: CommentMessageInput,
  ): Promise<BaseOutput> {
    return this.commentsService.commentMessage(user, id, commentMessageInput);
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
    @Body() editCommentInput: EditMessageCommentInput,
  ): Promise<BaseOutput> {
    return this.commentsService.editComment(user, id, editCommentInput);
  }

  /** findMessageComments */
  @Get(':id')
  findMessageComments(
    @Param('id') messageId: number,
    @Query('prev') prev: number,
  ): Promise<MessageComment[]> {
    return this.commentsService.findMessageComments(messageId, prev);
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

/** Family Message  */
@Controller('message/family')
export class MessageFamilyController {
  constructor(private readonly messageFamService: MessageFamilyService) {}

  /** createMessageFamily: 해당 가족이 받아볼 메세지 정보 생성 (Admin) */
  @Post()
  createMessageFamily(
    @AuthUser() user: UserId,
    @Body() createMessageFamInput: CreateMessageFamInput,
  ): Promise<BaseOutput> {
    return this.messageFamService.createMessage(user, createMessageFamInput);
  }

  /** deleteMessageFamily: 실제 삭제 X; 사용자에게 감추기; recommendation data로 활용 */
  // @Patch(':id/delete')
  // deleteMessageFamily(
  //   @AuthUser() user: UserId,
  //   @Param('id') id: number,
  // ): Promise<BaseOutput> {
  //   return this.messageFamService.deleteMessage(user, id);
  // }

  // Date 범위를 통해 당일의 메세지를 정함
  /** receiveMessage: Admin */
  // @Patch(':id/receive')
  // receiveMessage(
  //   @AuthUser() user: UserId,
  //   @Param('id') id: number,
  // ): Promise<BaseOutput> {
  //   return this.messageFamService.receiveMessage(user, id);
  // }

  /** editMessageFamily: 가족 메세지 정보 업데이트 (Admin용, 추후 User도 필요할 수도)
   * user용으로 사용 시에는 반드시 AuthUser() 데코레이터 삽입
   */
  // @Patch(':id')
  // editMessageFamily(
  //   @Param('id') id: number,
  //   @Body() editMessageFamInput: EditMessageFamInput,
  // ): Promise<BaseOutput> {
  //   // ux 상 editMessage와 editMessageFamily는 동시에 발생
  //   // editMessage에서 editMessageFamily를 호출하여 사용할 수 있도록 Param 사용 X
  //   return this.messageFamService.editMessage(editMessageFamInput);
  // }

  @Get('latest')
  findMessageLatest(
    @AuthUser() user: UserId,
  ): Promise<MessageFamilyOutput | null> {
    return this.messageFamService.findMessageLatest(user);
  }

  @Get('today/count')
  findFamilyMessageTodayCnt(@AuthUser() user: UserId): Promise<number> {
    return this.messageFamService.findFamilyMessageTodayCnt(user);
  }

  @Get('today/all')
  findFamilyMessageTodayAll(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<MessageFamilyOutput[]> {
    return this.messageFamService.findFamilyMessageTodayAll(user, prev);
  }

  @Get('today')
  findFamilyMessageToday(
    @AuthUser() user: UserId,
  ): Promise<MessageFamilyOutput | null> {
    return this.messageFamService.findFamilyMessageToday(user);
  }

  @Get('keep')
  findFamilyMessageKept(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<{ date: string; messages: MessageFamily[] }[]> {
    return this.messageFamService.findFamilyMessageKept(user, prev);
  }

  /** findFamilyMessageFamily */
  @Get()
  findFamilyMessages(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<{ date: string; messages: MessageFamily[] }[]> {
    return this.messageFamService.findFamilyMessages(user, prev);
  }

  /** findMessageFamily */
  @Get(':id')
  findMessageFamily(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<MessageFamilyOutput> {
    return this.messageFamService.findMessage(user, id);
  }

  /** MeToo Message */
  @Post(':id/metoo')
  metooMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messageFamService.metooMessage(user, id);
  }

  /** quit MeToo Message */
  @Delete(':id/metoo')
  deleteMetooMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messageFamService.deleteMetooMessage(user, id);
  }

  /** keep Message */
  @Post(':id/keep')
  keepMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messageFamService.keepMessage(user, id);
  }

  /** quit keep Message */
  @Delete(':id/keep')
  deleteKeepMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.messageFamService.deleteKeepMessage(user, id);
  }
}

/** MessageFamily Comments */
@Controller('message/family/comments')
export class MessageFamCommentsController {
  constructor(private readonly commentsService: MessageFamCommentsService) {}

  /** createMessageComment */
  @Post(':id')
  commentMessage(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() commentMessageFamInput: CommentMessageFamInput,
  ): Promise<BaseOutput> {
    return this.commentsService.commentMessage(
      user,
      id,
      commentMessageFamInput,
    );
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
    @Body() editCommentInput: EditMessageFamCommentInput,
  ): Promise<BaseOutput> {
    return this.commentsService.editComment(user, id, editCommentInput);
  }

  /** findMessageComments */
  @Get(':id')
  findMessageComments(
    @Param('id') messageId: number,
    @Query('prev') prev: number,
  ): Promise<MessageFamilyComment[]> {
    return this.commentsService.findMessageComments(messageId, prev);
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
