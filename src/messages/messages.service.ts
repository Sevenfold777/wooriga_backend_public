import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Family } from 'src/family/entities/familiy.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Between,
  DataSource,
  FindManyOptions,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { CommentMessageFamInput } from './dtos/comment-message-family.dto';
import { CommentMessageInput } from './dtos/comment-message.dto';
import { CreateMessageFamInput } from './dtos/create-message-family.dto';
import {
  CreateMessageInput,
  CreateMessageOutput,
} from './dtos/create-message.dto';
import {
  EditMessageCommentInput,
  EditMessageFamCommentInput,
} from './dtos/edit-message-comment.dto';
import { EditMessageFamInput } from './dtos/edit-message-family.dto';
import { EditMessageInput } from './dtos/edit-message.dto';
import { MessageFamilyOutput, MessageOutput } from './dtos/message-output.dto';
import { MessageCommentLike } from './entities/message-comment-like.entity';
import { MessageComment } from './entities/message-comment.entity';
import { MessageFamilyCommentLike } from './entities/message-family-comment-like.entity';
import { MessageFamilyComment } from './entities/message-family-comment.entity';
import { MessageFamilyKeep } from './entities/message-family-keep.entity';
import { MessageFamilyMetoo } from './entities/message-family-metoo.entity';
import { MessageFamily } from './entities/message-family.entity';
import { MessageKeep } from './entities/message-keep.entity';
import { MessageMetoo } from './entities/message-metoo.entity';
import { Message } from './entities/message.entity';
import { messaging as FCM } from 'firebase-admin';
import { NotificationService } from 'src/notification/notification.service';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { Status } from 'src/common/entities/comment.entity';
import { ROUTE_NAME } from 'src/common/navigation-route';
import { ANONYMOUS_KEYS } from 'src/common/comment-decorator';
import { UserId } from 'src/auth/auth-user.decorator';

function messageFormatter(payload: string): string {
  let result: string = payload;
  const alpha = /[a-zA-Z]/;

  /** preprocessing */
  while (true) {
    const initVal = result;
    /** 1. 띄어쓰기 2개 이상 1개로 병합 */
    result = result.trim().replace(/ +/g, ' ');

    /** 2. 개행 2개 이상 1개로 병합 */
    result = result.replace(/\n+/g, '\n');

    /** 3. 개행 앞뒤 공백 없애기 */
    result = result.replace(/ +\n +/g, '\n');

    if (initVal === result) break;
  }

  /** loop start */
  let count = 0; // 단어 개수
  let lastBlank: number;
  /** 4. 공백, 글자 수 체크하면서 loop */
  for (let index = 0; index < result.length; index++, count++) {
    const char = result[index];

    /** 추가: 영어는 0.5자 */
    if (alpha.test(char)) {
      count -= 0.5;
    }

    /** 4-1. 공백 만나면 index 저장 */
    if (char === ' ') {
      lastBlank = index;
      count--;
    }

    /** 5. count가 15 초과 시, 이전 공백을 개행으로 replace + count 초기화 */
    if (count > 12) {
      /** 띄어쓰기 없이 15 문자 이상 가면 현재 위치에서 바로 자르기 */
      if (result[lastBlank] === '\n') {
        lastBlank = index - 1;
      }

      /** 현재 위치나 마지막으로 찾은 공백에 개행 넣기 */
      result =
        result.substring(0, lastBlank) + '\n' + result.substring(lastBlank + 1);

      /** count 초기화 */
      count = 0;
    }

    /** 6. 개행 만나면 count 초기화 */
    if (char === '\n') {
      /** count 초기화 */
      count = 0;
    }
  }

  return result;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(MessageMetoo)
    private metooRepository: Repository<MessageMetoo>,
    @InjectRepository(MessageKeep)
    private keepRepository: Repository<MessageKeep>,
    private readonly notificationService: NotificationService,
  ) {}

  /** createMessage */
  async sendMessage(
    { userId }: UserId,
    { payload, emotion, isNow }: CreateMessageInput,
  ): Promise<CreateMessageOutput> {
    // 30분 뒤 업로드
    const uploadAt = new Date();

    if (!isNow) {
      uploadAt.setMinutes(uploadAt.getMinutes() + 30);
    }

    const payloadToStore = messageFormatter(payload);

    const commentDecorator =
      ANONYMOUS_KEYS[Math.floor(Math.random() * 10000) % ANONYMOUS_KEYS.length];

    const message = this.messageRepository.create({
      emotion,
      payload: payloadToStore,
      author: { id: userId },
      uploadAt,
      commentDecorator,
    });

    try {
      await this.messageRepository.save(message);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    return { ok: true, id: message.id };
  }

  /** deleteMessage */
  async deleteMessage({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.messageRepository.delete({
      id,
      author: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: 'Message not found.' };
    }

    this.notificationService.unscheduleNotification(`message_${id}`);

    return { ok: true };
  }

  /** updateMessage */
  async editMessage(
    { userId }: UserId,
    id: number,
    { payload, emotion, isNow }: EditMessageInput,
  ): Promise<BaseOutput> {
    const payloadToStore = messageFormatter(payload);

    const result = await this.messageRepository.update(
      { id, author: { id: userId } },
      {
        payload: payloadToStore,
        emotion,
        ...(isNow && { uploadAt: new Date() }),
      },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Message not found.' };
    }

    return { ok: true };
  }

  /** findMyVoices */
  async findMyMessages(
    { userId, familyId }: UserId,
    prev: number,
  ): Promise<Message[]> {
    // 20개씩
    const take = 20;

    const messages = await this.messageRepository.find({
      where: {
        author: { id: userId },
        messageFamily: { family: { id: familyId } },
      },
      relations: { messageFamily: true },
      order: { createdAt: 'DESC' },
      take,
      skip: take * prev,
    });

    return messages;
  }

  /** findAllMessages */
  async findAllMessages(
    { userId }: UserId,
    limit: number,
    orderBy: string,
    prev: number,
  ): Promise<MessageOutput[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId, status: Status.ACTIVE },
    });

    const position = user.position;
    const birthday = user.birthday;

    const take = 20;
    const now = new Date();
    const nowString = `${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    // 나이대 기준
    const younger = new Date(birthday);
    const older = new Date(birthday);
    younger.setFullYear(birthday.getFullYear() + 5);
    older.setFullYear(birthday.getFullYear() - 5);

    let messages: Message[];
    let messagesRaw;

    const lastDate = '2023-04-24';

    // 기본 typeorm repo param: 최근 이야기
    const repoParams: FindManyOptions = {
      where: { uploadAt: LessThan(new Date(lastDate)) },
      // where: { uploadAt: LessThan(now) },
      relations: {
        metoos: true,
        comments: true,
        keeps: true,
        messageFamily: { sender: true },
      },
      order: { uploadAt: 'DESC' },
      take: limit ? limit : take,
      skip: prev * take,
    };

    let queryString: string;

    switch (orderBy) {
      case 'new':
        break;

      case 'metoos':
        queryString = `
          with message_by_comment as (select message.id as id, message.uploadAt, message.payload, message.emotion,
            count(distinct comments.id) as commentsCount, count(distinct F.id) as sharedCount from message
            left outer join (select * from message_comment where message_comment.status = "active") as comments on message.id = comments.messageId
            left outer join (select * from message_family where message_family.senderId <> 4) as F on message.id = F.messageId
            where message.uploadAt < '${lastDate}'
            group by message.id
            order by count(comments.id) DESC)
          select message_by_comment.id, uploadAt, payload, emotion, sharedCount, commentsCount, count(distinct message_metoo.id) as metoosCount,
            (select count(message_metoo.id) from message_metoo
              where message_metoo.userId = ${userId} and message_metoo.messageId = message_by_comment.id) as isMetooed,
            (select count(message_keep.id) from message_keep
              where message_keep.userId = ${userId} and message_keep.messageId = message_by_comment.id) as isKept
          from message_by_comment
            left outer join message_metoo on message_metoo.messageId = message_by_comment.id
            left outer join message_keep on message_keep.messageId = message_by_comment.id
            group by message_by_comment.id
            order by count(message_metoo.id) desc, commentsCount desc, id desc
            limit ${limit ? limit : take} offset ${prev * take};`;
        break;

      case 'shared':
        queryString = `
            with message_by_comment as (select message.id as id, message.uploadAt, message.payload, message.emotion, 
              count(distinct comments.id) as commentsCount, count(distinct F.id) as sharedCount from message
              left outer join (select * from message_comment where message_comment.status = "active") as comments on message.id = comments.messageId
              left outer join (select * from message_family where message_family.senderId <> 4) as F on message.id = F.messageId
              where message.uploadAt < '${lastDate}'
              group by message.id
              order by count(comments.id) DESC)
            select message_by_comment.id, uploadAt, payload, emotion, sharedCount, commentsCount, count(distinct message_metoo.id) as metoosCount,
              (select count(message_metoo.id) from message_metoo 
                where message_metoo.userId = ${userId} and message_metoo.messageId = message_by_comment.id) as isMetooed,
              (select count(message_keep.id) from message_keep
                where message_keep.userId = ${userId} and message_keep.messageId = message_by_comment.id) as isKept
            from message_by_comment
              left outer join message_metoo on message_metoo.messageId = message_by_comment.id
              left outer join message_keep on message_keep.messageId = message_by_comment.id
              group by message_by_comment.id
              order by sharedCount desc, id desc
              limit ${limit ? limit : take} offset ${prev * take};
            `;
        break;
      case 'recommend':
        repoParams.where['author'] = {
          position,
          birthday: Between(older, younger),
        };
        break;

      case DailyEmotions.HAPPY:
        repoParams.where['emotion'] = DailyEmotions.HAPPY;
        break;

      case DailyEmotions.PASSION:
        repoParams.where['emotion'] = DailyEmotions.PASSION;
        break;

      case DailyEmotions.COMFORT:
        repoParams.where['emotion'] = DailyEmotions.COMFORT;
        break;

      case DailyEmotions.TIRED:
        repoParams.where['emotion'] = DailyEmotions.TIRED;
        break;

      case DailyEmotions.SHARP:
        repoParams.where['emotion'] = DailyEmotions.SHARP;
        break;

      case DailyEmotions.SAD:
        repoParams.where['emotion'] = DailyEmotions.SAD;
        break;

      default:
        break;
    }

    if (queryString) {
      messagesRaw = await this.dataSource.query(queryString);

      return messagesRaw.map((message) => {
        return {
          id: message.id,
          payload: message.payload,
          emotion: message.emotion,
          uploadAt: message.uploadAt,
          commentsCount: parseInt(message.commentsCount),
          metoosCount: parseInt(message.metoosCount),
          isMetooed: Boolean(parseInt(message.isMetooed)),
          isKept: Boolean(parseInt(message.isKept)),
          sharedCount: parseInt(message.sharedCount),
        };
      });
    } else {
      messages = await this.messageRepository.find(repoParams);

      return messages.map((message) => {
        const comments = message.comments.filter(
          (message) => message.status === Status.ACTIVE,
        );

        const messageFam = message.messageFamily.filter(
          (message) => message.sender?.id !== 4,
        );

        return {
          id: message.id,
          payload: message.payload,
          emotion: message.emotion,
          uploadAt: message.uploadAt,
          commentsCount: comments.length,
          metoosCount: message.metoos.length,
          isMetooed: Boolean(
            message.metoos.find((metoo) => metoo.user.id === userId),
          ),
          isKept: Boolean(
            message.keeps.find((metoo) => metoo.user.id === userId),
          ),
          sharedCount: messageFam.length,
        };
      });
    }
  }

  /** findMessage */
  async findMessage({ userId }: UserId, id: number): Promise<MessageOutput> {
    // const message = await this.messageRepository.findOne({
    //   where: { id },
    //   relations: { comments: true, metoos: true, keeps: true },
    // });

    const message = await this.dataSource.query(`
    with message_by_comment as (select messageToFind.id as id, messageToFind.uploadAt, messageToFind.payload, messageToFind.emotion, commentDecorator,
      count(distinct comments.id) as commentsCount, count(distinct F.id) as sharedCount 
      from (select * from message as M where M.id = ${id}) messageToFind
      left outer join (select * from message_comment where message_comment.status = "active") as comments on messageToFind.id = comments.messageId
      left outer join (select * from message_family where message_family.senderId <> 4) as F on messageToFind.id = F.messageId
      group by messageToFind.id)
    select message_by_comment.id, uploadAt, payload, emotion, sharedCount, commentsCount, count(distinct message_metoo.id) as metoosCount,
      (select count(message_metoo.id) from message_metoo 
        where message_metoo.userId = ${userId} and message_metoo.messageId = message_by_comment.id) as isMetooed,
      (select count(message_keep.id) from message_keep
        where message_keep.userId = ${userId} and message_keep.messageId = message_by_comment.id) as isKept, commentDecorator
    from message_by_comment
      left outer join message_metoo on message_metoo.messageId = message_by_comment.id
      left outer join message_keep on message_keep.messageId = message_by_comment.id
      group by message_by_comment.id
      limit 1;
    `);

    return {
      id: message[0].id,
      payload: message[0].payload,
      emotion: message[0].emotion,
      uploadAt: message[0].uploadAt,
      commentsCount: parseInt(message[0].commentsCount),
      metoosCount: parseInt(message[0].metoosCount),
      sharedCount: parseInt(message[0].sharedCount),
      isMetooed: Boolean(parseInt(message[0].isMetooed)),
      isKept: Boolean(parseInt(message[0].isKept)),
      commentDecorator: message[0].commentDecorator,
    };
  }

  /** MeToo Message */
  async metooMessage({ userId }: UserId, id: number): Promise<BaseOutput> {
    const exist = await this.metooRepository.findOne({
      where: { message: { id }, user: { id: userId } },
    });

    if (exist) {
      return { ok: false, error: 'Already Liked.' };
    }

    const metoo = this.metooRepository.create({
      message: { id },
      user: { id: userId },
    });

    try {
      await this.metooRepository.save(metoo);
    } catch (e) {
      return { ok: false, error: "Couldn't metoo Message." };
    }

    return { ok: true };
  }

  /** quit MeToo Message */
  async deleteMetooMessage(
    { userId }: UserId,
    id: number,
  ): Promise<BaseOutput> {
    const result = await this.metooRepository.delete({
      message: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Coudn't delete metoo." };
    }

    return { ok: true };
  }

  async keepMessage({ userId }: UserId, id: number): Promise<BaseOutput> {
    const exist = await this.keepRepository.findOne({
      where: { message: { id }, user: { id: userId } },
    });

    if (exist) {
      return { ok: false, error: 'Already kept.' };
    }

    const keep = this.keepRepository.create({
      message: { id },
      user: { id: userId },
    });

    try {
      await this.keepRepository.save(keep);
    } catch (e) {
      return { ok: false, error: "Couldn't keep Message." };
    }

    return { ok: true };
  }

  /** quit keep Message */
  async deleteKeepMessage({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.keepRepository.delete({
      message: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Coudn't delete keep." };
    }

    return { ok: true };
  }

  /** find Message Kept */
  async findMessagesKept(
    { userId }: UserId,
    prev: number,
  ): Promise<{ date: string; messages: Message[] }[]> {
    const take = 5;

    // const messages = await this.messageRepository.find({
    //   where: { keeps: { user: { id: userId } } },
    //   order: { uploadAt: 'DESC' },
    //   take,
    //   skip: take * prev,
    // });

    const messages = await this.dataSource.query(`
    select message_keep.createdAt as keptAt, message.id, message.payload, message.emotion from message
    inner join message_keep on message.id = message_keep.messageId
    where message_keep.userId = ${userId} and date_format(message_keep.createdAt, '%Y-%m-%d') in 
    (
      select * from 
          (
            select distinct date_format(k.createdAt, '%Y-%m-%d') as d
            from message as m
                    inner join message_keep as k on m.id = k.messageId
                    where k.userId = ${userId}
            order by d desc
                    limit ${take} offset ${prev * take}) as datesInOrder
          )
    order by uploadAt desc;
    `);

    /** format: groupBy Date */
    const messageByDate: { date: string; messages: Message[] }[] = [];

    let existFlag = false;
    for (const message of messages) {
      const rawDate = new Date(
        Date.UTC(
          message.keptAt.getFullYear(),
          message.keptAt.getMonth(),
          message.keptAt.getDate(),
        ),
      );

      const date = rawDate.toISOString();

      for (let index = 0; index < messageByDate.length; index++) {
        if (messageByDate[index].date === date) {
          messageByDate[index].messages.push(message);

          existFlag = true;
        }
      }
      if (!existFlag) {
        messageByDate.push({ date, messages: [message] });
      }

      existFlag = false;
    }

    // this.notificationService.getAllSchedules(); ///// for DEBUG!!!!!

    return messageByDate;
  }
}

@Injectable()
export class MessageCommentsService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(MessageComment)
    private commentRepository: Repository<MessageComment>,
    @InjectRepository(MessageCommentLike)
    private likeRepository: Repository<MessageCommentLike>,
    private readonly notificationService: NotificationService,
  ) {}
  /** createMessageComment */
  async commentMessage(
    { userId, familyId }: UserId,
    id: number,
    { payload }: CommentMessageInput,
  ): Promise<BaseOutput> {
    // create comment
    const comment = this.commentRepository.create({
      payload,
      author: { id: userId },
      message: { id },
    });

    try {
      await this.commentRepository.save(comment);
    } catch (e) {
      return { ok: false, error: "Couldn't create the comment." };
    }

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
    editCommentInput: EditMessageCommentInput,
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

  /** findMessageComments */
  async findMessageComments(
    messageId: number,
    prev: number,
  ): Promise<MessageComment[]> {
    const take = 20;

    const comments = await this.commentRepository.find({
      where: { message: { id: messageId }, status: Status.ACTIVE },
      order: { createdAt: 'DESC' },
      take,
      skip: take * prev,
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
      return { ok: false, error: "Couldn't find result." };
    }

    return { ok: true };
  }
}

/** MessageFamily: Message에 대한 가족 정보 (댓글, 감정 표현 등) */
@Injectable()
export class MessageFamilyService {
  constructor(
    @InjectRepository(Family) private familyRepository: Repository<Family>,
    @InjectRepository(MessageFamily)
    private messageFamRepository: Repository<MessageFamily>,
    @InjectRepository(MessageFamilyMetoo)
    private metooRepository: Repository<MessageFamilyMetoo>,
    @InjectRepository(MessageFamilyKeep)
    private keepRepository: Repository<MessageFamilyKeep>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  /** createMessageFamily */
  async createMessage(
    { userId, familyId }: UserId,
    { messageId, isNow }: CreateMessageFamInput,
  ): Promise<BaseOutput> {
    const receiveDate = new Date();

    if (!isNow) {
      receiveDate.setMinutes(receiveDate.getMinutes() + 30);
    }

    const message = this.messageFamRepository.create({
      family: { id: familyId },
      message: { id: messageId },
      receiveDate,
      sender: { id: userId },
    });

    try {
      await this.messageFamRepository.save(message);
    } catch (e) {
      return { ok: false, error: e.code };
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

    // const notifResult = await FCM().sendToDevice(
    //   familyFCMTokens,
    //   {
    //     notification: {
    //       title: '우리가 이야기',
    //       body: '우리 가족에 새로운 이야기가 도착했습니다!',
    //     },
    //   },
    //   { contentAvailable: true, priority: 'high' },
    // );
    isNow
      ? await this.notificationService.sendNotification({
          tokens: familyMembers.map((user) => user.fcmToken),
          title: '오늘의 이야기',
          body: '우리 가족에 새로운 이야기가 도착했습니다!',
          screen: ROUTE_NAME.MESSAGE_HOME,
          senderId: userId,
          receiversId: familyMembers.map((user) => user.id),
        })
      : await this.notificationService.scheduleNotification({
          scheduleName: `message_${messageId}`,
          tokens: familyMembers.map((user) => user.fcmToken),
          title: '오늘의 이야기',
          body: '우리 가족에 새로운 이야기가 도착했습니다!',
          timeToSend: receiveDate,
          screen: ROUTE_NAME.MESSAGE_HOME,
          senderId: userId,
          receiversId: familyMembers.map((user) => user.id),
        });

    return { ok: true };
  }

  /** deleteMessageFamily: 실제 삭제X, 원치 않는 이야기로 등록 - 추천 기능 강화 */
  // async deleteMessage({ family }: User, id: number): Promise<BaseOutput> {
  //   const result = await this.messageFamRepository.update(
  //     { id, family: { id: family.id } },
  //     { isRejected: true },
  //   );

  //   if (result.affected === 0) {
  //     return { ok: false, error: 'Message not found.' };
  //   }

  //   return { ok: true };
  // }

  /** updateMessage */
  async editMessage(
    { userId, familyId }: UserId,
    { messageId, isNow }: EditMessageFamInput,
  ): Promise<BaseOutput> {
    if (!isNow) {
      return { ok: true };
    }

    const now = new Date();

    const result = await this.messageFamRepository.update(
      { message: { id: messageId } },
      isNow && { receiveDate: now },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Message not found.' };
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

    await this.notificationService.fireScheduledNotification({
      scheduleName: `message_${messageId}`,
      tokens: familyMembers.map((user) => user.fcmToken),
      title: '오늘의 이야기',
      body: '우리 가족에 새로운 이야기가 도착했습니다!',
      screen: ROUTE_NAME.MESSAGE_HOME,
      senderId: userId,
      receiversId: familyMembers.map((user) => user.id),
    });

    return { ok: true };
  }

  async findFamilyMessageTodayCnt({ familyId }: UserId): Promise<number> {
    const now = new Date();
    const today = new Date(new Date().toLocaleDateString('ko-KR'));

    const [messages, count] = await this.messageFamRepository.findAndCount({
      where: {
        family: { id: familyId },
        receiveDate: Between(today, now),
      },
    });

    return count;
  }

  async findFamilyMessageTodayAll(
    { userId, familyId }: UserId,
    prev: number,
  ): Promise<MessageFamilyOutput[]> {
    const take = 20;
    const now = new Date();
    const today = new Date(new Date().toLocaleDateString('ko-KR'));

    // console.time();
    const messages = await this.messageFamRepository.find({
      where: {
        family: { id: familyId },
        receiveDate: Between(today, now),
      },
      relations: { comments: true, metoos: true, keeps: true },
      order: { receiveDate: 'DESC' },
      take: 20,
      skip: take * prev,
    });
    // console.timeEnd();

    // format messages with computedFields
    const messageOutput = messages.map((message) => {
      const comments = message.comments.filter(
        (message) => message.status === Status.ACTIVE,
      );

      return {
        id: message.id,
        payload: message.message.payload,
        emotion: message.message.emotion,
        receiveDate: message.receiveDate,
        commentsCount: comments.length,
        metoosCount: message.metoos.length,
        isMetooed: Boolean(
          message.metoos.find((metoo) => metoo.user.id === userId),
        ),
        isKept: Boolean(message.keeps.find((keep) => keep.user.id === userId)),
      };
    });

    return messageOutput;
  }

  /** findFamilyMessages: Today */
  async findFamilyMessageToday({
    userId,
    familyId,
  }: UserId): Promise<MessageFamilyOutput | null> {
    const now = new Date();
    const today = new Date(new Date().toLocaleDateString('ko-KR'));

    const message = await this.messageFamRepository.findOne({
      where: {
        family: { id: familyId },
        receiveDate: Between(today, now),
      },
      relations: { comments: true, metoos: true, keeps: true },
      order: { receiveDate: 'DESC' },
    });

    // console.log(message.message.payload.replace(' ', '').length);
    if (!message) {
      return null;
    }

    const comments = message.comments.filter(
      (comment) => comment.status === Status.ACTIVE,
    );

    return {
      id: message.id,
      payload: message.message.payload,
      emotion: message.message.emotion,
      receiveDate: message.receiveDate,
      commentsCount: comments.length,
      metoosCount: message.metoos.length,
      isMetooed: Boolean(
        message.metoos.find((metoo) => metoo.user.id === userId),
      ),
      isKept: Boolean(message.keeps.find((keep) => keep.user.id === userId)),
    };
  }

  /** findFamilyMessages */
  async findFamilyMessages(
    { familyId }: UserId,
    prev: number,
  ): Promise<{ date: string; messages: MessageFamily[] }[]> {
    const take = 5;

    const now = new Date();
    const nowString = `${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    // const family = await this.familyRepository.findOne({
    //   where: { id: familyId, messageFamily: { receiveDate: LessThan(now) } },
    //   relations: { messageFamily: { comments: true, metoos: true } },
    //   order: { messageFamily: { receiveDate: 'DESC' } },
    // });

    // const messages = await this.messageFamRepository.find({
    //   where: { family: { id: familyId }, receiveDate: LessThan(now) },
    //   order: { receiveDate: 'DESC' },

    //   take,
    //   skip: take * prev,
    // });

    const messages = await this.dataSource.query(`
      select message_family.receiveDate, message_family.id, message.payload, message.emotion from message_family
      inner join message on message_family.messageId = message.id
      where familyId = ${familyId} and receiveDate < '${nowString}' and 
        date_format(receiveDate, '%Y-%m-%d') in 
      (
        select * from 
          (
            select distinct date_format(m.receiveDate, '%Y-%m-%d') as d
            from message_family as m
            where m.familyId = ${familyId}
            order by d desc
                    limit ${take} offset ${prev * take}) as datesInOrder
          )
      order by receiveDate desc
    `);

    /** format: groupBy Date */
    const messageByDate: { date: string; messages: MessageFamily[] }[] = [];

    let existFlag = false;
    for (const message of messages) {
      const rawDate = new Date(
        Date.UTC(
          message.receiveDate.getFullYear(),
          message.receiveDate.getMonth(),
          message.receiveDate.getDate(),
        ),
      );

      const date = rawDate.toISOString();

      for (let index = 0; index < messageByDate.length; index++) {
        if (messageByDate[index].date === date) {
          messageByDate[index].messages.push(message);

          existFlag = true;
        }
      }
      if (!existFlag) {
        messageByDate.push({ date, messages: [message] });
      }

      existFlag = false;
    }

    return messageByDate;
  }

  /** findMessage */
  async findMessage(
    { userId, familyId }: UserId,
    id: number,
  ): Promise<MessageFamilyOutput> {
    const message = await this.messageFamRepository.findOne({
      where: { id, family: { id: familyId } },
      relations: { metoos: true, keeps: true, comments: true },
    });

    const comments = message.comments.filter(
      (comment) => comment.status === Status.ACTIVE,
    );

    return {
      id: message.id,
      payload: message.message.payload,
      emotion: message.message.emotion,
      receiveDate: message.receiveDate,
      commentsCount: comments.length,
      metoosCount: message.metoos.length,
      isMetooed: Boolean(
        message.metoos.find((metoo) => metoo.user.id === userId),
      ),
      isKept: Boolean(message.keeps.find((keep) => keep.user.id === userId)),
      linkTo: message.message.linkTo,
    };
  }

  // receive message createdAt의 범위를 통해 당일의 이야기를 만들기 때문에
  /** receiveMessage: Admin */
  // async receiveMessage(
  //   { family: { id: familyId } }: User,
  //   id,
  // ): Promise<BaseOutput> {
  //   const result = await this.messageFamRepository.update(
  //     { id, family: { id: familyId } },
  //     { isShown: true },
  //   );

  //   if (result.affected === 0) {
  //     return { ok: false, error: 'Message not found.' };
  //   }

  //   return { ok: true };
  // }

  async metooMessage({ userId }: UserId, id: number): Promise<BaseOutput> {
    const exist = await this.metooRepository.findOne({
      where: { message: { id }, user: { id: userId } },
    });

    if (exist) {
      return { ok: false, error: 'Already Liked.' };
    }

    const metoo = this.metooRepository.create({
      message: { id },
      user: { id: userId },
    });

    try {
      await this.metooRepository.save(metoo);
    } catch (e) {
      return { ok: false, error: "Couldn't metoo Message." };
    }

    return { ok: true };
  }

  /** quit MeToo Message */
  async deleteMetooMessage(
    { userId }: UserId,
    id: number,
  ): Promise<BaseOutput> {
    const result = await this.metooRepository.delete({
      message: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Coudn't delete metoo." };
    }

    return { ok: true };
  }

  async keepMessage({ userId }: UserId, id: number): Promise<BaseOutput> {
    const exist = await this.keepRepository.findOne({
      where: { message: { id }, user: { id: userId } },
    });

    if (exist) {
      return { ok: false, error: 'Already Liked.' };
    }

    const keep = this.keepRepository.create({
      message: { id },
      user: { id: userId },
    });

    try {
      await this.keepRepository.save(keep);
    } catch (e) {
      return { ok: false, error: "Couldn't keep Message." };
    }

    return { ok: true };
  }

  /** quit keep Message */
  async deleteKeepMessage({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.keepRepository.delete({
      message: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Coudn't delete keep." };
    }

    return { ok: true };
  }

  /** find Message Kept */
  async findFamilyMessageKept(
    { userId, familyId }: UserId,
    prev: number,
  ): Promise<{ date: string; messages: MessageFamily[] }[]> {
    const take = 5;

    // const messages = await this.messageFamRepository.find({
    //   where: { keeps: { user: { id: userId } } },
    //   order: { receiveDate: 'DESC' },
    //   take,
    //   skip: take * prev,
    // });

    const messages = await this.dataSource.query(`
      select message_family_keep.createdAt as keptAt, message_family.id, message.payload, message.emotion from message_family
      inner join message on message_family.messageId = message.id
      inner join message_family_keep on message_family.id = message_family_keep.messageId
      where familyId = ${familyId} and message_family_keep.userId = ${userId} and date_format(message_family_keep.createdAt, '%Y-%m-%d') in 
      (
        select * from 
            (
              select distinct date_format(k.createdAt, '%Y-%m-%d') as d
              from message_family as m
                      inner join message_family_keep as k on m.id = k.messageId
                      where k.userId = ${userId}
              order by d desc
                      limit ${take} offset ${take * prev}) as datesInOrder
            )
      order by keptAt desc
    `);

    /** format: groupBy Date */
    const messageByDate: { date: string; messages: MessageFamily[] }[] = [];

    let existFlag = false;
    for (const message of messages) {
      const rawDate = new Date(
        Date.UTC(
          message.keptAt.getFullYear(),
          message.keptAt.getMonth(),
          message.keptAt.getDate(),
        ),
      );

      const date = rawDate.toISOString();

      for (let index = 0; index < messageByDate.length; index++) {
        if (messageByDate[index].date === date) {
          messageByDate[index].messages.push(message);

          existFlag = true;
        }
      }
      if (!existFlag) {
        messageByDate.push({ date, messages: [message] });
      }

      existFlag = false;
    }

    // console.log(messageByDate);

    return messageByDate;
  }

  async findMessageLatest({
    userId,
    familyId,
  }: UserId): Promise<MessageFamilyOutput | null> {
    const message = await this.messageFamRepository.findOne({
      where: {
        family: { id: familyId },
        receiveDate: LessThanOrEqual(new Date()),
      },
      relations: { comments: true, metoos: true, keeps: true },
      order: { receiveDate: 'DESC' },
    });

    if (!message) {
      return null;
    }

    const comments = message.comments.filter(
      (comment) => comment.status === Status.ACTIVE,
    );

    return {
      id: message.id,
      payload: message.message.payload,
      emotion: message.message.emotion,
      receiveDate: message.receiveDate,
      commentsCount: comments.length,
      metoosCount: message.metoos.length,
      isMetooed: Boolean(
        message.metoos.find((metoo) => metoo.user.id === userId),
      ),
      isKept: Boolean(message.keeps.find((keep) => keep.user.id === userId)),
      linkTo: message.message.linkTo,
    };
  }
}

/** MessageFamily Comments */
@Injectable()
export class MessageFamCommentsService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(MessageFamily)
    private messageRepository: Repository<MessageFamily>,
    @InjectRepository(MessageFamilyComment)
    private commentRepository: Repository<MessageFamilyComment>,
    @InjectRepository(MessageFamilyCommentLike)
    private likeRepository: Repository<MessageFamilyCommentLike>,
    private readonly notificationService: NotificationService,
  ) {}
  /** createMessageComment */
  async commentMessage(
    { userId, familyId }: UserId,
    id: number,
    { payload }: CommentMessageFamInput,
  ): Promise<BaseOutput> {
    // create comment
    const comment = this.commentRepository.create({
      payload,
      author: { id: userId },
      message: { id },
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
      title: '우리가 이야기',
      body: `우리 가족이 이야기에 댓글을 작성했습니다. "${
        payload.length > 8 ? payload.slice(0, 8) + '...' : payload
      }"`,
      screen: ROUTE_NAME.MESSAGE_FAMILY,
      param: { messageId: id },
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
      { status: Status.DELETED },
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
    editCommentInput: EditMessageFamCommentInput,
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

  /** findMessageComments */
  async findMessageComments(
    messageId: number,
    prev: number,
  ): Promise<MessageFamilyComment[]> {
    const take = 20;

    const comments = await this.commentRepository.find({
      where: { message: { id: messageId }, status: Status.ACTIVE },
      order: { createdAt: 'DESC' },
      take,
      skip: take * prev,
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
